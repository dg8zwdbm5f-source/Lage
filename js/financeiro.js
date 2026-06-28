document.addEventListener("DOMContentLoaded", async () => {
    const statusDiv = document.getElementById("status-conexao");
    
    // 1. Busca os dados da API
    const dados = await carregarDados();
    
    if (!dados || dados.length === 0) {
        statusDiv.innerHTML = '<span style="color: #f75a68;">❌ Erro ao carregar ou planilha vazia.</span>';
        return;
    }

    statusDiv.style.display = "none";

    let totalGasto = 0;
    let totalPago = 0;
    let totalPendente = 0;
    
    // Usaremos uma array para acumular o HTML da tabela de forma ultra rápida
    const linhasTabela = [];

    // 2. Processar os dados na memória
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

        // Adiciona a linha na nossa array de memória
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

    // 3. Injeta todas as linhas de uma vez só (Ganho massivo de performance)
    document.getElementById("tabelaCorpo").innerHTML = linhasTabela.join("");

    // 4. Atualiza os cartões
    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = dados.length;
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
});
