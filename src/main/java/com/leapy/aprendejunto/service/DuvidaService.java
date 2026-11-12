package com.leapy.aprendejunto.service;

import com.leapy.aprendejunto.model.Duvida;
import com.leapy.aprendejunto.model.SessaoEstudo;
import com.leapy.aprendejunto.model.StatusDuvida;
import com.leapy.aprendejunto.model.Usuario;
import com.leapy.aprendejunto.repository.DuvidaRepository;
import com.leapy.aprendejunto.repository.SessaoEstudoRepository;
import com.leapy.aprendejunto.repository.UsuarioRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DuvidaService {

    private final DuvidaRepository duvidaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SessaoEstudoRepository sessaoEstudoRepository;

    @Transactional(readOnly = true)
    public List<Duvida> listarDuvidasAbertas() {
        return duvidaRepository.findByStatus(StatusDuvida.ABERTA);
    }

    @Transactional
    public Duvida postarDuvida(Duvida duvida, Long idAprendiz) {
        Usuario aprendiz = buscarUsuario(idAprendiz);
        int saldoAtual = aprendiz.getSaldoMoedas() == null ? 0 : aprendiz.getSaldoMoedas();
        if (saldoAtual <= 0) {
            throw new IllegalStateException("Usuário não possui moedas suficientes para postar uma dúvida");
        }

        aprendiz.setSaldoMoedas(saldoAtual - 1);
        usuarioRepository.save(aprendiz);

        duvida.setId(null);
        duvida.setAlunoAprendiz(aprendiz);
        duvida.setStatus(StatusDuvida.ABERTA);
        return duvidaRepository.save(duvida);
    }

    @Transactional
    public SessaoEstudo aceitarDuvida(Long idDuvida, Long idTutor) {
        Duvida duvida = duvidaRepository.findById(idDuvida)
                .orElseThrow(() -> new IllegalArgumentException("Dúvida não encontrada"));
        if (duvida.getStatus() != StatusDuvida.ABERTA) {
            throw new IllegalStateException("A dúvida não está disponível para aceite");
        }

        Usuario tutor = buscarUsuario(idTutor);
        duvida.setStatus(StatusDuvida.EM_SESSAO);
        duvidaRepository.save(duvida);

        SessaoEstudo sessao = new SessaoEstudo();
        sessao.setDataInicio(LocalDateTime.now());
        sessao.setLinkSalaWebRtc("sala-xyz");
        sessao.setDuvida(duvida);
        sessao.setAlunoTutor(tutor);
        return sessaoEstudoRepository.save(sessao);
    }

    @Transactional
    public SessaoEstudo encerrarSessao(Long idSessao, Integer estrelas) {
        if (estrelas == null || estrelas < 1 || estrelas > 5) {
            throw new IllegalArgumentException("A avaliação deve estar entre 1 e 5 estrelas");
        }

        SessaoEstudo sessao = sessaoEstudoRepository.findById(idSessao)
                .orElseThrow(() -> new IllegalArgumentException("Sessão não encontrada"));
        if (sessao.getDataFim() != null) {
            throw new IllegalStateException("A sessão já foi encerrada");
        }

        sessao.setDataFim(LocalDateTime.now());
        sessao.setAvaliacaoEstrelas(estrelas);

        Usuario tutor = sessao.getAlunoTutor();
        int saldoAtual = tutor.getSaldoMoedas() == null ? 0 : tutor.getSaldoMoedas();
        int recompensa = estrelas == 5 ? 2 : 1;
        tutor.setSaldoMoedas(saldoAtual + recompensa);
        usuarioRepository.save(tutor);

        Duvida duvida = sessao.getDuvida();
        duvida.setStatus(StatusDuvida.RESOLVIDA);
        duvidaRepository.save(duvida);

        return sessaoEstudoRepository.save(sessao);
    }

    private Usuario buscarUsuario(Long idUsuario) {
        return usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));
    }
}
