document.addEventListener("DOMContentLoaded", async () => {
    const statusDiv = document.getElementById("status-conexao");
    
    // 1. Puxa os dados brutos da API
    const dados = await carregarDados();
    
    if (!dados || dados.length === 0) {
        statusDiv.innerHTML = '<span style="color: #f75a68;">❌ Erro ao conectar ou dados vazios na planilha.</span>';
        return;
    }

    statusDiv.style.display = "none";

    let totalGasto = 0;
    let totalPago = 0;
    let totalPendente = 0;
    const linhasTabela = [];

    // 2. Processa os dados de forma otimizada
    dados.forEach(item => {
        const valor = Number(item.valor) || 0;
        totalGasto += valor;

        const statusLimpo = item.status ? item.status.trim().toLowerCase() : "";
        if (statusLimpo === "pago") {
            totalPago += valor;
        } else {
            totalPendente += valor;
        }

        let dataFormatada = item.dataCompra;
        if (dataFormatada && dataFormatada.includes("T")) {
            dataFormatada = new Date(dataFormatada).toLocaleDateString("pt-BR");
        }

        linhasTabela.push(`
            <tr>
                <td>${dataFormatada || "-"}</td>
                <td>${item.fornecedor || "-"}</td>
                <td>${item.descricao || "-"}</td>
                <td>R$ ${valor.toFixed(2).replace(".", ",")}</td>
                <td>${item.conta || "-"}</td>
                <td><span class="status-badge ${statusLimpo}">${item.status || "Pendente"}</span></td>
            </tr>
        `);
    });

    // 3. Injeta a tabela inteira de uma única vez (Carregamento instantâneo)
    document.getElementById("tabelaCorpo").innerHTML = lines = linhasTabela.join("");

    // 4. Alimenta os cartões de cabeçalho
    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = dados.length;
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    // 5. Aciona os gráficos analíticos
    renderizarGraficos(dados);
});
