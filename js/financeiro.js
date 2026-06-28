document.addEventListener("DOMContentLoaded", async () => {
    const statusDiv = document.getElementById("status-conexao");
    
    // 1. Busca os dados usando a função do api.js
    const dados = await carregarDados();
    
    if (!dados || dados.length === 0) {
        statusDiv.innerHTML = '<span style="color: #ff4d4d;">❌ Erro ao carregar ou planilha vazia.</span>';
        return;
    }

    // Se chegou aqui, deu certo! Sumir com a mensagem de carregamento
    statusDiv.style.display = "none";

    let totalGasto = 0;
    let totalPago = 0;
    let totalPendente = 0;
    const tabelaCorpo = document.getElementById("tabelaCorpo");

    // Clear na tabela por segurança
    tabelaCorpo.innerHTML = "";

    // 2. Processar cada linha recebida da planilha
    dados.forEach(item => {
        const valor = Number(item.valor) || 0;
        totalGasto += valor;

        // Validar status (tratando maiúsculas/minúsculas ou espaços)
        const statusLimpo = item.status ? item.status.trim().toLowerCase() : "";
        if (statusLimpo === "pago") {
            totalPago += valor;
        } else {
            totalPendente += valor;
        }

        // Formatar data se vier como timestamp do Google
        let dataFormatada = item.dataCompra;
        if (dataFormatada && dataFormatada.includes("T")) {
            dataFormatada = new Date(dataFormatada).toLocaleDateString("pt-BR");
        }

        // Injetar linha na tabela
        tabelaCorpo.innerHTML += `
            <tr>
                <td>${dataFormatada || "-"}</td>
                <td>${item.fornecedor || "-"}</td>
                <td>${item.descricao || "-"}</td>
                <td>R$ ${valor.toFixed(2).replace(".", ",")}</td>
                <td>${item.conta || "-"}</td>
                <td><span class="status-badge ${statusLimpo}">${item.status || "Pendente"}</span></td>
            </tr>
        `;
    });

    // 3. Atualizar os cartões na tela
    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = dados.length;
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
});
