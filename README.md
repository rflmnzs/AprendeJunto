# AprendeJunto

> Plataforma educacional peer-to-peer para conectar alunos em sessões rápidas de ajuda.

[![Java](https://img.shields.io/badge/Java-17%2B-102a43?style=flat-square)](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3%2B-102a43?style=flat-square)](https://spring.io/projects/spring-boot)
[![Status](https://img.shields.io/badge/status-MVP%20em%20desenvolvimento-102a43?style=flat-square)](#roadmap)

O AprendeJunto está no início do desenvolvimento. Este repositório contém a primeira base funcional do MVP; ainda estamos longe de uma versão 1.0 pronta para lançamento.

## Visão rápida

- [O que já existe](#o-que-já-existe)
- [Como funciona](#como-funciona)
- [Arquitetura](#arquitetura)
- [Como executar](#como-executar)
- [API disponível](#api-disponível)
- [Frontend](#frontend)
- [Roadmap](#roadmap)
- [Contribuindo](#contribuindo)

<details>
<summary><strong>O que já existe</strong></summary>

- Usuários com saldo inicial de 3 moedas.
- Publicação de dúvidas com custo de 1 moeda.
- Feed de dúvidas abertas.
- Aceite de uma dúvida por um aluno tutor.
- Criação de sessão de estudo com link WebRTC mockado.
- Encerramento de sessão com avaliação de 1 a 5 estrelas.
- Crédito de 1 moeda para o tutor ao finalizar a sessão.
- Interface estática responsiva com tema claro e escuro.

</details>

## Como funciona

```text
Aluno com dúvida
      │ publica (-1 moeda)
      ▼
Feed de dúvidas abertas
      │ tutor aceita
      ▼
Sessão de estudo de 15 minutos
      │ sessão encerrada (+1 moeda para o tutor)
      ▼
Dúvida resolvida
```

## Arquitetura

```text
src/main/java/com/leapy/aprendejunto
├── controller   → endpoints REST
├── model        → entidades JPA e enumerações
├── repository   → acesso a dados com Spring Data JPA
└── service      → regras de negócio e transações

frontend
├── index.html   → mural e feed de dúvidas
├── sala.html    → sala de estudo
├── style.css    → tema e layout responsivo
└── app.js       → integração com a API e interações
```

### Tecnologias

- Java 17
- Spring Boot 3.3
- Spring Web
- Spring Data JPA
- Bean Validation
- Lombok
- MySQL
- HTML, CSS e JavaScript puro no frontend do MVP

## Como executar

### Backend

Pré-requisitos:

- JDK 17 ou superior
- Maven instalado
- MySQL local na porta `3306`

1. Crie o banco:

   ```sql
   CREATE DATABASE aprendejunto_db;
   ```

2. Confira as credenciais em [`application.properties`](src/main/resources/application.properties).

3. Inicie a aplicação:

   ```bash
   mvn spring-boot:run
   ```

O backend ficará disponível em `http://localhost:8080`.

### Frontend

Abra [`frontend/index.html`](frontend/index.html) no navegador. Para evitar bloqueios de CORS ao usar `file://`, prefira servir a pasta com um servidor HTTP local, por exemplo:

```bash
cd frontend
python -m http.server 5500
```

Depois acesse `http://localhost:5500`.

> O frontend usa os usuários mockados `idAprendiz=1` e `idTutor=1`. Esses usuários precisam existir no banco para os fluxos de postagem e aceite funcionarem.

## API disponível

| Método | Endpoint | Objetivo |
| --- | --- | --- |
| `GET` | `/api/duvidas/feed` | Lista dúvidas abertas |
| `POST` | `/api/duvidas?idAprendiz={id}` | Publica uma dúvida e debita uma moeda |
| `POST` | `/api/duvidas/{id}/aceitar?idTutor={id}` | Aceita a dúvida e cria uma sessão |
| `POST` | `/api/sessoes/{id}/encerrar?estrelas={1-5}` | Encerra a sessão e credita o tutor |

## Frontend

O frontend atual é propositalmente simples e estático para acelerar a validação do conceito. Ele já possui:

- Mural com dúvidas abertas.
- Formulário para pedir ajuda.
- Redirecionamento para a sala de estudo.
- Cronômetro regressivo mockado de 15 minutos.
- Alternância de tema persistida em `localStorage`.
- Paleta visual sem verde, baseada em azul-marinho, cinza e branco.

## Roadmap

### MVP em desenvolvimento

- [x] Estrutura inicial do backend
- [x] Entidades e regras básicas de moedas
- [x] Endpoints REST principais
- [x] Primeiro frontend estático
- [ ] Cadastro e autenticação de usuários
- [ ] Persistência real de sessão WebRTC
- [ ] Tela de perfil e histórico
- [ ] Tratamento global de erros da API
- [ ] Testes automatizados
- [ ] Deploy de ambiente de homologação

### Depois do MVP

- [ ] Matching entre dúvidas e tutores
- [ ] Notificações em tempo real
- [ ] Moderação e denúncias
- [ ] Métricas de aprendizagem
- [ ] Preparação para uma versão 1.0

## Contribuindo

Este projeto está em fase inicial. Para propor uma mudança:

1. Crie uma branch descritiva.
2. Faça uma alteração pequena e focada.
3. Atualize a documentação quando necessário.
4. Valide o backend e o frontend localmente.
5. Abra um pull request explicando o contexto e o resultado esperado.

## Licença

Projeto em desenvolvimento. A licença ainda será definida antes do lançamento público.
