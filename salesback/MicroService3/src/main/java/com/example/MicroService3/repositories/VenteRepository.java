package com.example.MicroService3.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.MicroService3.models.Vente;

public interface VenteRepository extends JpaRepository<Vente,Long>{
	List<Vente> findByClientId(Long clientId);
}
