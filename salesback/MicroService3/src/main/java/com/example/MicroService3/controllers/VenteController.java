package com.example.MicroService3.controllers;

import java.util.Date;
import java.util.List;

import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.example.MicroService3.models.Client;
import com.example.MicroService3.models.Produit;
import com.example.MicroService3.models.Vente;
import com.example.MicroService3.repositories.VenteRepository;
import com.example.MicroService3.error.ErrorResponse;

@RestController
@RequestMapping("/api/ventes")
public class VenteController {

    // Names the services register under in Consul (their spring.application.name).
    private static final String PRODUIT_SERVICE = "MicroService1";
    private static final String CLIENT_SERVICE = "MicroService2";

    private final DiscoveryClient discoveryClient;
    private final VenteRepository venteRepository;
    private final RestTemplate restTemplate;

    public VenteController(DiscoveryClient discoveryClient,
                           VenteRepository venteRepository,
                           RestTemplate restTemplate) {
        this.discoveryClient = discoveryClient;
        this.venteRepository = venteRepository;
        this.restTemplate = restTemplate;
    }

    // Resolves a sibling service through Consul; null when nothing is registered under that name.
    private String baseUrlOf(String serviceName) {
        List<ServiceInstance> instances = discoveryClient.getInstances(serviceName);
        if (instances == null || instances.isEmpty()) {
            return null;
        }
        return instances.get(0).getUri().toString();
    }

    private ResponseEntity<?> unavailable(String serviceName) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ErrorResponse(serviceName + " is not registered in Consul"));
    }

    @GetMapping(value = "/produits", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> callProduits() {
        String baseUrl = baseUrlOf(PRODUIT_SERVICE);
        if (baseUrl == null) {
            return unavailable(PRODUIT_SERVICE);
        }
        try {
            Produit[] produits = restTemplate.getForObject(baseUrl + "/api/produits", Produit[].class);
            return ResponseEntity.ok(produits);
        } catch (RestClientException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse("Error fetching data from " + PRODUIT_SERVICE + ": " + e.getMessage()));
        }
    }

    @GetMapping(value = "/clients", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> callClients() {
        String baseUrl = baseUrlOf(CLIENT_SERVICE);
        if (baseUrl == null) {
            return unavailable(CLIENT_SERVICE);
        }
        try {
            Client[] clients = restTemplate.getForObject(baseUrl + "/api/clients", Client[].class);
            return ResponseEntity.ok(clients);
        } catch (RestClientException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse("Error fetching data from " + CLIENT_SERVICE + ": " + e.getMessage()));
        }
    }

    @GetMapping(value = "/clients/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getClientById(@PathVariable Long id) {
        String baseUrl = baseUrlOf(CLIENT_SERVICE);
        if (baseUrl == null) {
            return unavailable(CLIENT_SERVICE);
        }
        try {
            Client client = restTemplate.getForObject(baseUrl + "/api/clients/" + id, Client.class);
            return ResponseEntity.ok(client);
        } catch (RestClientException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse("Error fetching client data: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/produits/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getProduitById(@PathVariable Long id) {
        String baseUrl = baseUrlOf(PRODUIT_SERVICE);
        if (baseUrl == null) {
            return unavailable(PRODUIT_SERVICE);
        }
        try {
            Produit produit = restTemplate.getForObject(baseUrl + "/api/produits/" + id, Produit.class);
            return ResponseEntity.ok(produit);
        } catch (RestClientException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse("Error fetching produit data: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/clients/add", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addClient(@RequestBody Client client) {
        String baseUrl = baseUrlOf(CLIENT_SERVICE);
        if (baseUrl == null) {
            return unavailable(CLIENT_SERVICE);
        }
        try {
            Client createdClient = restTemplate.postForObject(baseUrl + "/api/clients/add", client, Client.class);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdClient);
        } catch (RestClientException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse("Error creating client: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/produits/add", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addProduit(@RequestBody Produit produit) {
        String baseUrl = baseUrlOf(PRODUIT_SERVICE);
        if (baseUrl == null) {
            return unavailable(PRODUIT_SERVICE);
        }
        try {
            Produit createdProduit = restTemplate.postForObject(baseUrl + "/api/produits/add", produit, Produit.class);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdProduit);
        } catch (RestClientException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse("Error creating produit: " + e.getMessage()));
        }
    }

    @GetMapping
    public List<Vente> getVentes() {
        return venteRepository.findAll();
    }

    @GetMapping("/client/{clientId}")
    public List<Vente> getVentesByClient(@PathVariable Long clientId) {
        return venteRepository.findByClientId(clientId);
    }

    @PostMapping("/add")
    public ResponseEntity<?> createVente(@RequestBody Vente vente) {
        // id_client and id_produit are non-null columns, so both references must come
        // from the request body. The previous signature took a bare Client parameter,
        // which Spring bound as an empty model attribute and wrote over the body.
        if (vente.getClient() == null || vente.getClient().getId() == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("client.id is required"));
        }
        if (vente.getProduit() == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("produit.id is required"));
        }
        if (vente.getDate() == null) {
            vente.setDate(new Date());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(venteRepository.save(vente));
    }
}
