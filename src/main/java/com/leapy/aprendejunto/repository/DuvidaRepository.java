package com.leapy.aprendejunto.repository;

import com.leapy.aprendejunto.model.Duvida;
import com.leapy.aprendejunto.model.StatusDuvida;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DuvidaRepository extends JpaRepository<Duvida, Long> {

    List<Duvida> findByStatus(StatusDuvida status);
}
