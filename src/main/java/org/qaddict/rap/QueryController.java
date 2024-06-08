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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static java.util.Objects.isNull;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

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
            Pageable pageable,
            PagedResourcesAssembler<?> pagedResourcesAssembler
    ) throws IOException {
        EntityPath<?> entityPath = entities.get(entity);
        var parser = new QuerydslParser(entityPath, QueryVariables.none());

        JPAQuery<?> query = select.isBlank() ? queryFactory.select(entityPath) : queryFactory.select(parser.parseSelect(select));

        query.from(entityPath);

        if(!where.isBlank()) query.where(parser.parsePredicate(where));
        if(!orderBy.isBlank()) query.orderBy(parser.parseOrderSpecifier(orderBy));
        if(!groupBy.isBlank()) query.groupBy(parser.parseSelect(groupBy));
        if(!having.isBlank()) query.having(parser.parsePredicate(having));
        if(pageable.getPageNumber() > 0) query.offset((long) pageable.getPageNumber() * pageable.getPageSize());
        if(pageable.getPageSize() > 0) query.limit(pageable.getPageSize());

        return pagedResourcesAssembler.toModel(new PageImpl(query.fetch(), pageable, query.fetchCount()));

        //return size > 0
        //        ? PagedModel.of(query.fetch(), new PagedModel.PageMetadata(size, page, query.fetchCount()))
        //        : CollectionModel.of(query.fetch());

    }

}
