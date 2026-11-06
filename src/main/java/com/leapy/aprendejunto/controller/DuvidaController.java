package com.leapy.aprendejunto.controller;

import com.leapy.aprendejunto.model.Duvida;
import com.leapy.aprendejunto.model.SessaoEstudo;
import com.leapy.aprendejunto.service.DuvidaService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class DuvidaController {

    private final DuvidaService duvidaService;

    @GetMapping("/duvidas/feed")
    public List<Duvida> listarFeed() {
        return duvidaService.listarDuvidasAbertas();
    }

    @PostMapping("/duvidas")
    @ResponseStatus(HttpStatus.CREATED)
    public Duvida postarDuvida(@Valid @RequestBody Duvida duvida,
                               @RequestParam Long idAprendiz) {
        return duvidaService.postarDuvida(duvida, idAprendiz);
    }

    @PostMapping("/duvidas/{id}/aceitar")
    @ResponseStatus(HttpStatus.CREATED)
    public SessaoEstudo aceitarDuvida(@PathVariable Long id,
                                      @RequestParam Long idTutor) {
        return duvidaService.aceitarDuvida(id, idTutor);
    }

    @PostMapping("/sessoes/{id}/encerrar")
    public SessaoEstudo encerrarSessao(@PathVariable Long id,
                                       @RequestParam Integer estrelas) {
        return duvidaService.encerrarSessao(id, estrelas);
    }
}
