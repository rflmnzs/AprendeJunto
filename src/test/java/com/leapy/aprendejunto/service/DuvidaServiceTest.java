package com.leapy.aprendejunto.service;

import com.leapy.aprendejunto.model.Duvida;
import com.leapy.aprendejunto.model.SessaoEstudo;
import com.leapy.aprendejunto.model.StatusDuvida;
import com.leapy.aprendejunto.model.Usuario;
import com.leapy.aprendejunto.repository.DuvidaRepository;
import com.leapy.aprendejunto.repository.SessaoEstudoRepository;
import com.leapy.aprendejunto.repository.UsuarioRepository;
import java.util.Optional;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DuvidaServiceTest {
    @ParameterizedTest
    @CsvSource({"1,4", "2,4", "3,4", "4,4", "5,5"})
    void recompensaTutorConformeAvaliacaoSemCreditarNovamente(int estrelas, int saldoEsperado) {
        DuvidaRepository duvidas = mock(DuvidaRepository.class);
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        SessaoEstudoRepository sessoes = mock(SessaoEstudoRepository.class);
        DuvidaService service = new DuvidaService(duvidas, usuarios, sessoes);
        Usuario tutor = new Usuario();
        tutor.setSaldoMoedas(3);
        Duvida duvida = new Duvida();
        duvida.setStatus(StatusDuvida.EM_SESSAO);
        SessaoEstudo sessao = new SessaoEstudo();
        sessao.setAlunoTutor(tutor);
        sessao.setDuvida(duvida);
        when(sessoes.findById(1L)).thenReturn(Optional.of(sessao));
        when(sessoes.save(sessao)).thenReturn(sessao);

        service.encerrarSessao(1L, estrelas);

        assertEquals(saldoEsperado, tutor.getSaldoMoedas());
        assertEquals(StatusDuvida.RESOLVIDA, duvida.getStatus());
        assertNotNull(sessao.getDataFim());
        assertThrows(IllegalStateException.class, () -> service.encerrarSessao(1L, estrelas));
        assertEquals(saldoEsperado, tutor.getSaldoMoedas());
        verify(usuarios, times(1)).save(tutor);
    }
}
