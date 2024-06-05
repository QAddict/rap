package org.qaddict.rap;

import com.querydsl.core.types.EntityPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import foundation.jpa.querydsl.QueryVariables;
import foundation.jpa.querydsl.QuerydslParser;
import jakarta.persistence.EntityManager;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Map;

@RestController
public class QueryController {

    private final EntityManager entityManager;
    private final Map<String, EntityPath<?>> entities;
    private final JPAQueryFactory queryFactory;

    public QueryController(EntityManager entityManager, Map<String, EntityPath<?>> entities, JPAQueryFactory queryFactory) {
        this.entityManager = entityManager;
        this.entities = entities;
        this.queryFactory = queryFactory;
    }

    @GetMapping("/get/{entity}/{id}")
    public EntityModel<?> get(@PathVariable String entity, @PathVariable String id) {
        return EntityModel.of(entityManager.find(entities.get(entity).getType(), id));
    }

    @GetMapping("/query/{entity}")
    public CollectionModel<?> query(
            @PathVariable String entity,
            @RequestParam(defaultValue = "") String from,
            @RequestParam(defaultValue = "") String where,
            @RequestParam(defaultValue = "") String orderBy,
            @RequestParam(defaultValue = "") String select,
            @RequestParam(defaultValue = "") String groupBy,
            @RequestParam(defaultValue = "") String having,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) throws IOException {
        EntityPath<?> entityPath = entities.get(entity);
        var parser = new QuerydslParser(entityPath, QueryVariables.none());

        JPAQuery<?> query = select.isBlank() ? queryFactory.select(entityPath) : queryFactory.select(parser.parseSelect(select));

        query.from(from.isBlank() ? entityPath : entities.get(from));

        if(!where.isBlank()) query.where(parser.parsePredicate(where));
        if(!orderBy.isBlank()) query.orderBy(parser.parseOrderSpecifier(orderBy));
        if(!groupBy.isBlank()) query.groupBy(parser.parseSelect(groupBy));
        if(!having.isBlank()) query.having(parser.parsePredicate(having));
        if(page > 0) query.offset((long) page * size);
        if(size > 0) query.limit(size);

        return size > 0
                ? PagedModel.of(query.fetch(), new PagedModel.PageMetadata(size, page, query.fetchCount()))
                : CollectionModel.of(query.fetch());

    }

}
