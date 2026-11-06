package com.leapy.aprendejunto.repository;

import com.leapy.aprendejunto.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
}
