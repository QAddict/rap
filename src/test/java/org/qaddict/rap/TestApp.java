package org.qaddict.rap;

import com.querydsl.core.types.EntityPath;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

import static org.qaddict.rap.QBook.book;

@SpringBootApplication
public class TestApp {

    public static void main(String[] args) {
        SpringApplication.run(TestApp.class, args);
    }

    @Bean
    public List<EntityPath<?>> entityPaths() {
        return List.of(book);
    }

    @Bean
    public JPAQueryFactory jpaQueryFactory(EntityManager entityManager) {
        return new JPAQueryFactory(entityManager);
    }

    @Bean
    public Iterable<Book> books(BookRepository bookRepository) {
        return bookRepository.saveAll(List.of(
                new Book().setTitle("Hahaha").setAuthor(new Author().setFirstName("Mark").setLastName("Twain")),
                new Book().setTitle("Krtek").setAuthor(new Author().setFirstName("Zdenek").setLastName("Miller"))
        ));
    }
}
