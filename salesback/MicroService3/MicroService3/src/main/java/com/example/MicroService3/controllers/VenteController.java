package com.example.MicroService3.controllers;

import java.sql.Date;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.example.MicroService3.models.Client;
import com.example.MicroService3.models.Produit;
import com.example.MicroService3.models.Vente;
import com.example.MicroService3.repositories.VenteRepository;
import com.example.MicroService3.error.*;

@RestController
@RequestMapping("/api/ventes/")
public class VenteController {

    @Autowired
    private DiscoveryClient discoveryClient;
    @Autowired
    List<ServiceInstance> instances;
    @Autowired
    VenteRepository venteRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    

    
    @GetMapping(value = "/produits", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> callProduits() {
        
    	instances =  discoveryClient.getInstances("api-gateway");
        
        if (instances != null && !instances.isEmpty()) {
            String ProduitUrl = instances.get(0).getUri().toString() + "/api/produits/";
            
            try {
                // If you know the response will be a list of Produit objects
                Produit[] produits = restTemplate.getForObject(ProduitUrl, Produit[].class);
                return ResponseEntity.ok(produits);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error fetching data from MicroService1: " + e.getMessage()));
            }
        }
        
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("MicroService1 not available"));
    }
    
    
    @GetMapping(value = "/clients", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> callClients() {
        
    	instances =  discoveryClient.getInstances("api-gateway");
        if (instances != null && !instances.isEmpty()) {
            String ClientUrl = instances.get(0).getUri().toString() + "/api/clients/";
            

            try {
               
                Client[] clients = restTemplate.getForObject(ClientUrl, Client[].class);
                return ResponseEntity.ok(clients);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error fetching data from MicroService2: " + e.getMessage()));
            }
        }
        
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("MicroService1 not available"));
    }
    
    @GetMapping(value = "/clients/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getClientById(@PathVariable Long id) {
        instances = discoveryClient.getInstances("api-gateway");
        if (instances != null && !instances.isEmpty()) {
            String ClientUrl = instances.get(0).getUri().toString() + "/api/clients/" + id;

            try {
                Client client = restTemplate.getForObject(ClientUrl, Client.class);
                return ResponseEntity.ok(client);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error fetching client data: " + e.getMessage()));
            }
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("MicroService1 not available"));
    }
    
    @GetMapping(value = "/produits/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getProduitById(@PathVariable Long id) {
        instances = discoveryClient.getInstances("api-gateway");
        if (instances != null && !instances.isEmpty()) {
            String ProduitUrl = instances.get(0).getUri().toString() + "/api/produits/" + id;

            try {
                Produit produit = restTemplate.getForObject(ProduitUrl, Produit.class);
                return ResponseEntity.ok(produit);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error fetching produit data: " + e.getMessage()));
            }
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("MicroService1 not available"));
    }
   
    @PostMapping(value = "/clients/add", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addClient(@RequestBody Client client) {
        instances = discoveryClient.getInstances("api-gateway");
        if (instances != null && !instances.isEmpty()) {
            String ClientUrl = instances.get(0).getUri().toString() + "/api/clients/add";

            try {
                Client createdClient = restTemplate.postForObject(ClientUrl, client, Client.class);
                return ResponseEntity.status(HttpStatus.CREATED).body(createdClient);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error creating client: " + e.getMessage()));
            }
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("MicroService1 not available"));
    }

    
    @PostMapping(value = "/produits/add", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addProduit(@RequestBody Produit produit) {
        instances = discoveryClient.getInstances("api-gateway");
        if (instances != null && !instances.isEmpty()) {
            String ProduitUrl = instances.get(0).getUri().toString() + "/api/produits/add";

            try {
                Produit createdProduit = restTemplate.postForObject(ProduitUrl, produit, Produit.class);
                return ResponseEntity.status(HttpStatus.CREATED).body(createdProduit);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error creating produit: " + e.getMessage()));
            }
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("MicroService1 not available"));
    }
    
    @GetMapping("/")
    public List<Vente> getVentesByClient() {
        return venteRepository.findAll();
    }

    
    @PostMapping("/add")
    public ResponseEntity<Vente> createVente(@RequestBody Vente vente,  Client client) {
    	Date date = new Date(0);
        vente.setClient(client);
        vente.setDate(date);
        return ResponseEntity.ok(venteRepository.save(vente));
    }

    

}

// Add this class at the bottom of your file or in a separate file

