package org.qaddict.rap;

import jakarta.persistence.*;

@Entity
@SuppressWarnings("unused")
public class Book {

    @Id
    @GeneratedValue
    private Long id;

    private String title;

    @ManyToOne(cascade = CascadeType.ALL)
    private Author author;

    public Long getId() {
        return id;
    }

    public Book setId(Long id) {
        this.id = id;
        return this;
    }

    public String getTitle() {
        return title;
    }

    public Book setTitle(String title) {
        this.title = title;
        return this;
    }

    public Author getAuthor() {
        return author;
    }

    public Book setAuthor(Author author) {
        this.author = author;
        return this;
    }

}
