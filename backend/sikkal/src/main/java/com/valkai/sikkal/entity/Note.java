package com.valkai.sikkal.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "notes")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String subject;

    private String createdAt;

    public Note() {}

    public Note(String title, String content, String subject, String createdAt) {
        this.title = title;
        this.content = content;
        this.subject = subject;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getSubject() { return subject; }
    public String getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    public void setSubject(String subject) { this.subject = subject; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
