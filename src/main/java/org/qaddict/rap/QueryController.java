package org.qaddict.rap;

import com.querydsl.core.types.EntityPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import foundation.jpa.querydsl.QueryVariables;
import foundation.jpa.querydsl.QuerydslParser;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static java.util.Objects.isNull;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
public class QueryController {

    private final EntityManager entityManager;
    private final Map<String, EntityPath<?>> entities;
    private final JPAQueryFactory queryFactory;

    public QueryController(EntityManager entityManager, List<EntityPath<?>> entities, JPAQueryFactory queryFactory) {
        this.entityManager = entityManager;
        this.entities = entities.stream().collect(toMap(Object::toString, identity()));
        this.queryFactory = queryFactory;
    }

    @GetMapping("/get/{entity}/{id}")
    public EntityModel<?> get(@PathVariable String entity, @PathVariable String id) {
        Object object = entityManager.find(entities.get(entity).getType(), id);
        return isNull(object) ? null : EntityModel.of(object);
    }

    @GetMapping("/query/{entity}s")
    public CollectionModel<?> query(
            @PathVariable String entity,
            @RequestParam(defaultValue = "") String where,
            @RequestParam(defaultValue = "") String orderBy,
            @RequestParam(defaultValue = "") String select,
            @RequestParam(defaultValue = "") String groupBy,
            @RequestParam(defaultValue = "") String having,
            @RequestParam(defaultValue = "0") Long page,
            @RequestParam(defaultValue = "25") Long size
    ) throws IOException {
        EntityPath<?> entityPath = entities.get(entity);
        var parser = new QuerydslParser(entityPath, QueryVariables.none());

        JPAQuery<?> query = select.isBlank() ? queryFactory.select(entityPath) : queryFactory.select(parser.parseSelect(select));

        query.from(entityPath);

        if(!where.isBlank()) query.where(parser.parsePredicate(where));
        if(!orderBy.isBlank()) query.orderBy(parser.parseOrderSpecifier(orderBy));
        if(!groupBy.isBlank()) query.groupBy(parser.parseSelect(groupBy));
        if(!having.isBlank()) query.having(parser.parsePredicate(having));
        if(page > 0) query.offset(page * size);
        if(size > 0) query.limit(size);

        CollectionModel<?> model;

        if(size > 0) {
            PagedModel.PageMetadata pageMetadata = new PagedModel.PageMetadata(size, page, query.fetchCount());
            model = PagedModel.of(query.fetch(), pageMetadata);
            long lastPage = pageMetadata.getTotalPages() - 1;
            model.add(linkTo(methodOn(QueryController.class).query(entity, where, orderBy, select, groupBy, having, null, size)).withRel("page"));
            if(page > 0) {
                model.add(linkTo(methodOn(QueryController.class).query(entity, where, orderBy, select, groupBy, having, 0L, size)).withRel("first"));
                model.add(linkTo(methodOn(QueryController.class).query(entity, where, orderBy, select, groupBy, having, page - 1, size)).withRel("prev"));
            }
            if(page < lastPage) {
                model.add(linkTo(methodOn(QueryController.class).query(entity, where, orderBy, select, groupBy, having, page + 1, size)).withRel("next"));
                model.add(linkTo(methodOn(QueryController.class).query(entity, where, orderBy, select, groupBy, having, lastPage, size)).withRel("last"));
            }

            for(Long s : List.of(20L, 25L, 30L, 40L, 50L))
                model.add(linkTo(methodOn(QueryController.class).query(entity, where, orderBy, select, groupBy, having, 0L, s)).withRel("size" + s));

        } else {
            model = CollectionModel.of(query.fetch());
        }

        model.add(linkTo(methodOn(QueryController.class).query(entity, null, orderBy, select, groupBy, having, page, size)).withRel("search"));


        return model;
    }

}
