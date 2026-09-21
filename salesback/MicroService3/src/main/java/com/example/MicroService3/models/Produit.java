package com.example.MicroService3.models;




import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name="produits")
public class Produit {
	
	public Produit() {}
	@Id
	@Column(name="id")
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int id;
	@Column(name="libelle")
	private String nom;
	
	private String marque;
	
	private float prix;
	
	private int qteStock;

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public String getNom() {
		return nom;
	}

	public void setNom(String nom) {
		this.nom = nom;
	}

	public String getMarque() {
		return marque;
	}

	public void setMarque(String marque) {
		this.marque = marque;
	}

	public float getPrix() {
		return prix;
	}

	public void setPrix(float prix) {
		this.prix = prix;
	}

	public int getQteStock() {
		return qteStock;
	}

	public void setQteStock(int qteStock) {
		this.qteStock = qteStock;
	}

	public Produit(int id, String nom, String marque, float prix, int qteStock) {
		super();
		this.id = id;
		this.nom = nom;
		this.marque = marque;
		this.prix = prix;
		this.qteStock = qteStock;
	}
		
	
}

