package com.example.MicroService2.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.MicroService2.models.Client;
import com.example.MicroService2.repositories.Clientrepository;

@Service
public class ClientService {


    private final Clientrepository clientRepository;

    public ClientService(Clientrepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    public Client getClientById(Long id) {
        return clientRepository.findById(id).orElse(null);
    }

    public Client saveClient(Client client) {
        return clientRepository.save(client);
    }

    public void deleteClient(Long id) {
        clientRepository.deleteById(id);
    }
}