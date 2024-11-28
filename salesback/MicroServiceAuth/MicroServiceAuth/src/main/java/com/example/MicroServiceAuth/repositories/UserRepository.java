package com.example.MicroServiceAuth.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.MicroServiceAuth.models.User;

public interface UserRepository extends JpaRepository<User,Long> {
	Optional<User> findByUsername(String username);
}