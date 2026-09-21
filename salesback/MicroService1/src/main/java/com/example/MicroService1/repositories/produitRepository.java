package com.example.MicroService1.repositories;

import org.springframework.data.jpa.repository.JpaRepository;


import com.example.MicroService1.models.Produit;

public interface produitRepository extends JpaRepository<Produit, Integer>  {

}