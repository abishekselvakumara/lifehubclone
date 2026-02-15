package com.valkai.sikkal.repository;

import com.valkai.sikkal.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<Note, Long> {
}
