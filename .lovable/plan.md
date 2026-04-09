

# 🔥 Extintores — App de Inspeção de Extintores

## Visão Geral
Aplicativo web (PWA) profissional para inspeção de extintores de incêndio, com design **BOLD**, tema claro principal (branco, preto e vermelho como destaque), menu único sem barra inferior, e armazenamento em nuvem para acesso compartilhado.

---

## 1. Autenticação
- Tela de login simples e elegante com logo (ícone de fogo em preto + "Extintores")
- Login único: código **648808** e senha **seguranca**
- Todos os usuários acessam o mesmo painel com dados compartilhados

## 2. Backend (Lovable Cloud / Supabase)
- **Tabela de extintores**: código (3 dígitos), porto (2 dígitos), tipo (padrão: Pó ABC), peso (padrão: 6kg), vencimento garantia (opcional), 3º nível (opcional)
- **Tabela de inspeções**: código extintor, porto, data inspeção, status manômetro, lacre, placa, pintura do piso, descrições opcionais (placa/piso), datas de envio para revisão (lacre/manômetro), data de retorno, vencimento garantia, 3º nível
- Todos os registros armazenados em nuvem para acesso compartilhado em qualquer dispositivo

## 3. Menu Principal (Tela Única)
- **Painel de status no topo**: Total de extintores cadastrados, Aprovados (verde), Em Revisão (amarelo)
- **Botões empilhados**: Gerenciador de Extintores (ícone de lista), Planilha Geral, Métricas
- **Bloco de notificações abaixo**: extintores próximos de vencer (14 dias = vermelho, 30 dias = amarelo) para Vencimento Garantia ou 3º Nível; se nenhum urgente, mostra os 5 mais próximos
- **Botão de inspeção flutuante** (ícone de prancheta) centralizado na parte inferior — destaque visual principal
- **Barra superior**: botão modo escuro/claro, instalar PWA (oculto se já instalado), deslogar

## 4. Sistema de Inspeção (Menu Suspenso/Pop-up)
- **Etapa 1**: Numpad customizado (0-9) para digitar código do extintor (3 dígitos). Botão confirmar aparece mas não auto-confirma. Ao clicar fora, pop-up pergunta se deseja fechar
- **Etapa 2**: Numpad para digitar o Porto (2 dígitos)
- **Etapa 3**: Formulário de inspeção com:
  - Data da inspeção (preenchida automaticamente no formato DD/MM/AAAA, editável via numpad com "/" separando)
  - Vencimento Garantia e 3º Nível (puxados do cadastro se existirem, editáveis)
  - Botões Conforme/Não Conforme para: **Manômetro**, **Lacre**, **Placa**, **Pintura do Piso**
    - Manômetro ou Lacre "Não Conforme" → campo de data para envio à revisão → extintor recebe status "Em Revisão" (amarelo)
    - Placa ou Piso "Não Conforme" → campo de descrição opcional, sem status "Em Revisão"
  - Botões de fácil reconhecimento visual (design bold)
- Se o código digitado não existir no cadastro, o extintor é automaticamente adicionado à lista
- Otimização de datas: digitar "010226" → ao confirmar numpad → "01/02/2026"

## 5. Gerenciador de Extintores (Pop-up com ícone de lista)
- Lista de todos os extintores cadastrados com: código, porto, tipo, peso, vencimento garantia, 3º nível
- Status visual de vencimento: vermelho (≤14 dias), amarelo (≤30 dias) indicando tipo (Vencimento Garantia ou 3º Nível)
- Adicionar novo extintor (campos com numpad): código, porto, tipo, peso, vencimento garantia (opcional), 3º nível (opcional)
- Editar extintor existente
- Deletar extintor da lista
- Extintores em revisão contabilizados no painel principal
- Todas as informações organizadas de forma clara

## 6. Retorno de Extintor
- Extintores enviados para revisão aparecem com data de envio
- Ao retornar, atualizar com data de retorno e status atualizado
- Planilha mostra ambas as datas com status ao lado

## 7. Planilha Geral (Pop-up)
- Registro histórico de todas as inspeções, filtrável por mês/ano de referência
- Código do extintor e porto visíveis
- Ícones (não emojis) para marcações de conforme/não conforme
- Editar/deletar registros (requer senha "seguranca")
- Organizada com linhas, boa formatação, cores de status
- **Botão Imprimir** (ícone de impressora):
  - Abre página de impressão (não pop-up suspenso — documento real)
  - Selecionar mês/ano de referência (padrão: mês atual)
  - Mostra somente extintores inspecionados naquele mês
  - Formato planilha estilo Excel: linhas, centralizado, legível para A4
  - Ordenado por porto (numérico crescente)
  - Campo "Assinatura de validação" com linha no rodapé
  - Sem logo/link do Lovable (coberto de forma discreta)
  - Apenas 1 página, sem conteúdo vazio gerando páginas extras
  - Botões: Download (PNG/JPEG), Compartilhar
  - Textos em Português-BR correto (acentos, maiúsculas)

## 8. Métricas (Pop-up)
- Gráfico geral de revisões enviadas no ano (acima da lista de extintores)
- Colunas em preto, design moderno e simples
- Comparativo mensal: número de revisões vs número de inspeções lado a lado
- Ao clicar em cada extintor: frequência de envio para revisão
- Filtro por período (dia, mês, ano) — padrão: ano atual

## 9. PWA (Instalável)
- Botão discreto no topo para instalar como aplicativo web
- Oculto automaticamente se já estiver usando como app instalado

## 10. Design e UX
- **Tema BOLD**: preto como cor principal, vermelho como destaque, branco para fundo
- Modo claro (principal) e modo escuro alternável
- Sem barra inferior — tela única com pop-ups
- Todos os menus centralizados e responsivos para qualquer tela
- Numpad nunca auto-confirma, nunca preenche automaticamente
- "/" nos campos de data via numpad
- Sem traço longo "—", apenas espaçamento dinâmico
- Textos em Português-BR correto

