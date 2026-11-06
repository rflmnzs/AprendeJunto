package com.leapy.aprendejunto.config;

import com.leapy.aprendejunto.model.Duvida;
import com.leapy.aprendejunto.model.StatusDuvida;
import com.leapy.aprendejunto.model.Usuario;
import com.leapy.aprendejunto.repository.DuvidaRepository;
import com.leapy.aprendejunto.repository.UsuarioRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final DuvidaRepository duvidaRepository;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() > 0 || duvidaRepository.count() > 0) {
            return;
        }

        Usuario lucas = criarUsuario("Lucas", "lucas@aprendejunto.local", 3);
        Usuario heloa = criarUsuario("Helo\u00e1", "heloa@aprendejunto.local", 5);
        Usuario nicoly = criarUsuario("Nicoly", "nicoly@aprendejunto.local", 2);
        Usuario igor = criarUsuario("Igor", "igor@aprendejunto.local", 4);
        usuarioRepository.saveAll(List.of(lucas, heloa, nicoly, igor));

        duvidaRepository.saveAll(List.of(
                new Duvida(null, "Como resolver Bhaskara?", "Matem\u00e1tica",
                        "Preciso revisar o passo a passo da f\u00f3rmula de Bhaskara.",
                        StatusDuvida.ABERTA, lucas),
                new Duvida(null, "Leis de Newton", "F\u00edsica",
                        "Quero entender melhor como aplicar as tr\u00eas leis em exerc\u00edcios.",
                        StatusDuvida.ABERTA, nicoly),
                new Duvida(null, "O que \u00e9 um Mon\u00f3lito?", "Programa\u00e7\u00e3o",
                        "Gostaria de entender o conceito de arquitetura monol\u00edtica.",
                        StatusDuvida.ABERTA, igor)
        ));
    }

    private Usuario criarUsuario(String nome, String email, Integer saldoMoedas) {
        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenha("senha-mock");
        usuario.setSaldoMoedas(saldoMoedas);
        return usuario;
    }
}
