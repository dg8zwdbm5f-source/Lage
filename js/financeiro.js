/* --- Configurações Globais --- */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background-color: #121214;
    color: #e1e1e6;
    padding-bottom: 40px;
}

header {
    background-color: #1a1a1e;
    padding: 20px;
    text-align: center;
    border-bottom: 2px solid #29292e;
    margin-bottom: 25px;
}

header h1 {
    font-size: 1.8rem;
    color: #ffffff;
}

main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* --- Layout dos Cartões (Resumo) --- */
.cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.card {
    background-color: #1a1a1e;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #29292e;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s;
}

.card:hover {
    transform: translateY(-3px);
}

.card h3 {
    font-size: 0.9rem;
    color: #8d8d99;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.card h2 {
    font-size: 1.6rem;
    color: #ffffff;
}

/* Cores específicas para destacar os cartões */
.card:nth-child(1) h2 { color: #ffb800; } /* Total Gasto */
.card:nth-child(2) h2 { color: #633bbc; } /* Quantidade */
.card:nth-child(3) h2 { color: #00b37e; } /* Pago */
.card:nth-child(4) h2 { color: #f75a68; } /* Pendente */

/* --- Tabela de Lançamentos --- */
.container-tabela {
    background-color: #1a1a1e;
    border-radius: 8px;
    border: 1px solid #29292e;
    overflow-x: auto; /* Garante que role no celular se for grande */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

th, td {
    padding: 14px 20px;
    border-bottom: 1px solid #29292e;
    font-size: 0.95rem;
}

th {
    background-color: #202024;
    color: #c4c4cc;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.5px;
}

tr:hover {
    background-color: #202024;
}

td {
    color: #e1e1e6;
}

/* --- Badges de Status --- */
.status-badge {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
    display: inline-block;
}

.status-badge.pago {
    background-color: rgba(0, 179, 126, 0.1);
    color: #00b37e;
    border: 1px solid #00b37e;
}

.status-badge.pendente {
    background-color: rgba(247, 90, 104, 0.1);
    color: #f75a68;
    border: 1px solid #f75a68;
}

/* Se na planilha estiver escrito de outra forma (ex: Vencido) */
.status-badge.vencido {
    background-color: rgba(255, 184, 0, 0.1);
    color: #ffb800;
    border: 1px solid #ffb800;
}
