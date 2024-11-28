package com.example.MicroService1.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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


@RestController
@RequestMapping("/api/produits/")  
public class ProduitController {
	
	@Autowired
	produitRepository repo;
	
	@PostMapping("/add")
	   public ResponseEntity ajouter(@RequestBody Produit produit) {
	   try {
	    
		System.out.println(produit.getNom());
	    repo.save(produit);
	    
	    return new ResponseEntity<>(produit, HttpStatus.CREATED);
	    } catch (Exception e) {
	    
	    return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
	    }
	   }
	@GetMapping("/")
	public ResponseEntity<List<Produit>> produits() {
		
				List<Produit>listeProduits=(List<Produit>) repo.findAll();
	return new ResponseEntity<>(listeProduits, HttpStatus.OK);
		
	
	}
	@GetMapping("/{id}")
	 
	   public ResponseEntity<Produit> detail(@PathVariable("id") int id) {
	    
	    Optional<Produit>pp=repo.findById(id);
	    
	    if(pp.isPresent())
	      {
	     Produit p=pp.get();
	    return new ResponseEntity<>(p, HttpStatus.OK);
	     }
	    
	    return new ResponseEntity<>(HttpStatus.NOT_FOUND);
	 }

	@DeleteMapping("/{id}")
	public ResponseEntity<HttpStatus> supprimer(@PathVariable("id") int id) {
	try {
	
	repo.deleteById(id);
	
	return new ResponseEntity<>(HttpStatus.OK);
	} catch (Exception e) {
	
	return new ResponseEntity<>(HttpStatus.NO_CONTENT);
	}
	}
	@DeleteMapping("/vider")
	public ResponseEntity<HttpStatus> vider() {
	try {
	
	repo.deleteAll();
	
	return new ResponseEntity<>(HttpStatus.OK);
	} catch (Exception e) {
	
	return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
	}

	}
	@PutMapping("/{id}")
	public ResponseEntity<Produit> modifier(@PathVariable("id") int id,
	    @RequestBody Produit produit) {
	
	  if(repo.save(produit)!=null)
	  {
	   
	    return new ResponseEntity<>(HttpStatus.OK);
	  } else {
	    
		  
		  
	    return new ResponseEntity<>(HttpStatus.NOT_FOUND);
	  }
	}
}
