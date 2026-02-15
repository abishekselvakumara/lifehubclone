package com.valkai.sikkal.controller;

import com.valkai.sikkal.entity.Note;
import com.valkai.sikkal.repository.NoteRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "http://localhost:5173")
public class NoteController {

    private final NoteRepository noteRepository;

    public NoteController(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    // GET all notes
    @GetMapping
    public List<Note> getAllNotes() {
        return noteRepository.findAll();
    }

    // POST create note
    @PostMapping
    public Note createNote(@RequestBody Note note) {
        return noteRepository.save(note);
    }

    // PATCH update note
    @PatchMapping("/{id}")
    public Note updateNote(@PathVariable Long id, @RequestBody Note updatedNote) {
        return noteRepository.findById(id).map(note -> {
            note.setTitle(updatedNote.getTitle());
            note.setContent(updatedNote.getContent());
            note.setSubject(updatedNote.getSubject());
            return noteRepository.save(note);
        }).orElse(null);
    }

    // DELETE note
    @DeleteMapping("/{id}")
    public void deleteNote(@PathVariable Long id) {
        noteRepository.deleteById(id);
    }
}
