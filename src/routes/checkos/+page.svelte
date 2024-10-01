<script>
	import { onMount } from 'svelte';
	import { format } from 'date-fns';

	let clients = [];
	let searchQuery = '';
	let selectedClientId = null;
	let selectedClient = null;
	let serviceOrders = [];
	let isLoadingClients = false;
	let isLoadingOrders = false;
	let message = '';
	let type = 'info';

	onMount(() => {
		fetchClients();
	});

	async function fetchClients() {
		isLoadingClients = true;
		try {
			if (window.electron) {
				clients = await window.electron.fetchClients();
			} else {
				console.error('Electron API not available');
			}
		} catch (error) {
			console.error('Error fetching clients:', error);
			showNotification('Erro ao buscar clientes: ' + error.message, 'error');
		} finally {
			isLoadingClients = false;
		}
	}

	$: filteredClients = clients.filter(
		(client) =>
			client.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
			client.cpf?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			client.tel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			client.tel2?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	$: if (selectedClientId) {
		selectedClient = clients.find((client) => client.id === selectedClientId);
		fetchServiceOrders();
	} else {
		selectedClient = null;
		serviceOrders = [];
	}

	async function fetchServiceOrders() {
		isLoadingOrders = true;
		serviceOrders = [];
		try {
			if (window.electron) {
				serviceOrders = await window.electron.fetchServiceOrdersByClient(selectedClientId);
			} else {
				console.error('Electron API not available');
			}
		} catch (error) {
			console.error('Error fetching service orders:', error);
			showNotification('Erro ao buscar OS: ' + error.message, 'error');
		} finally {
			isLoadingOrders = false;
		}
	}

	function formatDate(dateStr) {
		return format(new Date(dateStr), 'dd/MM/yyyy');
	}

	function viewOS(os) {
		// Optionally, you can open a modal to display OS details
		// For now, we'll generate the OS content and open it in a new window
		const content = generateOSContent(os);
		const newWindow = window.open('', '', 'width=800,height=600');
		newWindow.document.write(content);
		newWindow.document.close();
	}

	function exportOSToPDF(os) {
		const content = generateOSContent(os);
		if (window.electron) {
			window.electron.printToPDF(content);
		} else {
			console.error('Electron API not available');
		}
	}

	function generateOSContent(os) {
		const totalValue = os.itens.reduce(
			(sum, item) => sum + item.preco_unitario * item.quantidade,
			0,
		);

		return `
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Ordem de Serviço</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; }
          .total-value { text-align: right; }
        </style>
      </head>
      <body>
        <h1>Ordem de Serviço</h1>
        <p><strong>Cliente:</strong> ${selectedClient.nome}</p>
        <p><strong>Data:</strong> ${formatDate(os.data)}</p>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Quantidade</th>
              <th>Preço Unitário</th>
              <th>Preço Total</th>
            </tr>
          </thead>
          <tbody>
            ${os.itens
				.map(
					(item) => `
              <tr>
                <td>${item.nome_peca}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${item.preco_unitario.toFixed(2)}</td>
                <td>R$ ${(item.preco_unitario * item.quantidade).toFixed(2)}</td>
              </tr>
            `,
				)
				.join('')}
            <tr>
              <td colspan="3" class="total">Valor Total</td>
              <td class="total-value">R$ ${totalValue.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <p><strong>Observação:</strong> ${os.observacao || 'Nenhuma'}</p>
      </body>
      </html>
    `;
	}

	function showNotification(msg, msgType) {
		message = msg;
		type = msgType;
		setTimeout(() => {
			message = '';
		}, 3000);
	}
</script>

<section>
	<h2>Consulta de OS</h2>
	<div class="form-main">
		<div class="client-list">
			<input
				type="text"
				placeholder="Pesquisar Cliente (Nome, CPF, Telefone)"
				bind:value={searchQuery}
			/>

			{#if isLoadingClients}
				<p>Carregando clientes...</p>
			{:else if filteredClients.length > 0}
				<ul>
					{#each filteredClients as client}
						<li>
							<button
								class:selected={client.id === selectedClientId}
								on:click={() => (selectedClientId = client.id)}
							>
								{client.nome} - {client.cpf}
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p>Nenhum cliente encontrado.</p>
			{/if}
		</div>

		<div class="service-orders">
			{#if selectedClient}
				<h2>OS de {selectedClient.nome}</h2>
				{#if isLoadingOrders}
					<p>Carregando OS...</p>
				{:else if serviceOrders.length > 0}
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Data</th>
								<th>Valor Total</th>
								<th>Ações</th>
							</tr>
						</thead>
						<tbody>
							{#each serviceOrders as os}
								<tr>
									<td>{os.id}</td>
									<td>{formatDate(os.data)}</td>
									<td>R$ {os.valor_total.toFixed(2)}</td>
									<td>
										<button on:click={() => viewOS(os)}>Visualizar</button>
										<button on:click={() => exportOSToPDF(os)}>
											Exportar PDF
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<p>Este cliente não possui OS.</p>
				{/if}
			{/if}
		</div>
	</div>
	{#if message}
		<div class={`notification ${type}`}>
			{message}
		</div>
	{/if}
</section>

<style lang="scss">
	section {
		display: grid;
		grid-template-rows: repeat(2, 1fr);
		gap: 1rem;
		width: 100%;
		height: 100%;
		padding: 10px;
		// background-color: #282828;
		color: #ffffff;
		font-family: 'Arial', sans-serif;
	}

	.form-main {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 20px;
		width: 100%;
		height: 100%;
	}

	.client-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-height: 80vh;

		input {
			padding: 8px;
			border: 1px solid #555;
			border-radius: 5px;
			background-color: #282828;
			color: #fff;
		}

		ul {
			list-style: none;
			padding: 0;
			margin: 0;

			overflow-y: auto;

			li {
				margin-bottom: 0px;

				button {
					width: 100%;

					padding: 8px;
					text-align: left;
					background-color: #333;
					border: 1px solid $bordercolor;
					// border-radius: 5px;
					margin: 0;
					color: #fff;
					cursor: pointer;

					&.selected {
						// background-color: $bgtestr;
						border: 1px solid $color2;
					}

					&:hover {
						background-color: #444;
					}
				}
			}
		}
	}

	.service-orders {
		display: flex;
		flex-direction: column;
		gap: 10px;

		h2 {
			margin-top: 0;
		}

		table {
			width: 100%;
			border-collapse: collapse;
			color: #fff;

			th,
			td {
				border: 1px solid #555;
				padding: 8px;
				text-align: left;
			}

			th {
				background-color: #333;
			}

			button {
				background-color: #282828;
				color: #ffffff;
				border: 1px solid #555;
				padding: 5px 10px;
				border-radius: 5px;
				cursor: pointer;

				&:hover {
					background-color: #444;
				}
			}
		}
	}

	.notification {
		position: fixed;
		top: 10px;
		right: 10px;
		padding: 10px;
		border-radius: 8px;
		color: #fff;
		background-color: #333;
	}

	.info {
		background-color: #5555b9;
	}

	.error {
		background-color: #9b1b1b;
	}

	.success {
		background-color: #256d25;
	}
</style>
