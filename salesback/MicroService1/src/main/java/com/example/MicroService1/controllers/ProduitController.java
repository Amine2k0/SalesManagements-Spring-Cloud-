package com.example.MicroService1.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.MicroService1.models.Produit;
import com.example.MicroService1.repositories.produitRepository;

// Mapped without a trailing slash: Spring Boot 3 no longer matches "/api/produits/"
// against "/api/produits", so the old "/api/produits/" + "/" mapping meant the
// collection was only reachable with a trailing slash.
@RestController
@RequestMapping("/api/produits")
public class ProduitController {

	private final produitRepository repo;

	public ProduitController(produitRepository repo) {
		this.repo = repo;
	}

	@GetMapping
	public ResponseEntity<List<Produit>> produits() {
		return new ResponseEntity<>(repo.findAll(), HttpStatus.OK);
	}

	@GetMapping("/{id}")
	public ResponseEntity<Produit> detail(@PathVariable("id") int id) {
		Optional<Produit> pp = repo.findById(id);
		return pp.map(produit -> new ResponseEntity<>(produit, HttpStatus.OK))
				.orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
	}

	@PostMapping("/add")
	public ResponseEntity<Produit> ajouter(@RequestBody Produit produit) {
		return new ResponseEntity<>(repo.save(produit), HttpStatus.CREATED);
	}

	// The id from the path wins, so a body without one updates the addressed row
	// instead of inserting a new product.
	@PutMapping("/{id}")
	public ResponseEntity<Produit> modifier(@PathVariable("id") int id, @RequestBody Produit produit) {
		if (!repo.existsById(id)) {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
		produit.setId(id);
		return new ResponseEntity<>(repo.save(produit), HttpStatus.OK);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> supprimer(@PathVariable("id") int id) {
		if (!repo.existsById(id)) {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
		repo.deleteById(id);
		return new ResponseEntity<>(HttpStatus.NO_CONTENT);
	}

	@DeleteMapping("/vider")
	public ResponseEntity<Void> vider() {
		repo.deleteAll();
		return new ResponseEntity<>(HttpStatus.NO_CONTENT);
	}
}
