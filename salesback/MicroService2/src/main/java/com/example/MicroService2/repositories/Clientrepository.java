package com.example.MicroService2.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.MicroService2.models.Client;

public interface Clientrepository extends JpaRepository<Client,Long>{

}
