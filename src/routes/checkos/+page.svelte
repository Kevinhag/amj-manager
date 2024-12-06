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

	// Variáveis para o modal de edição
	let showEditModal = false;
	let osToEdit = null;
	let editedOS = {};

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
			client.nome.toUpperCase().includes(searchQuery) ||
			(client.cpf && client.cpf.toUpperCase().includes(searchQuery)) ||
			(client.tel && client.tel.toUpperCase().includes(searchQuery)) ||
			(client.tel2 && client.tel2.toUpperCase().includes(searchQuery)),
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

	// Função para editar OS
	function editOS(os) {
		osToEdit = os;
		editedOS = {
			...os,
			itens: os.itens.map((item) => ({ ...item })),
		};
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		osToEdit = null;
		editedOS = {};
	}

	function updateItem(index, field, value) {
		editedOS.itens[index][field] = value;
		// Recalcular o valor total
		editedOS.valor_total = editedOS.itens.reduce(
			(sum, item) => sum + item.preco_unitario * item.quantidade,
			0,
		);
	}

	function removeItem(index) {
		editedOS.itens.splice(index, 1);
		// Recalcular o valor total
		editedOS.valor_total = editedOS.itens.reduce(
			(sum, item) => sum + item.preco_unitario * item.quantidade,
			0,
		);
	}

	function addItem() {
		editedOS.itens.push({
			nome_peca: '',
			marca_peca: '',
			quantidade: 1,
			preco_unitario: 0,
		});
		editedOS.valor_total = editedOS.itens.reduce(
			(sum, item) => sum + item.preco_unitario * item.quantidade,
			0,
		);
	}

	async function saveEditedOS() {
		try {
			// Prepare os dados para envio
			const osData = {
				id: editedOS.id,
				carro_id: editedOS.carro_id,
				observacao: editedOS.observacao.toUpperCase(),
				data: editedOS.data,
				valor_total: editedOS.valor_total,
				forma_pagamento: editedOS.forma_pagamento.toUpperCase(),
				itens: editedOS.itens.map((item) => ({
					nome_peca: item.nome_peca.toUpperCase(),
					marca_peca: item.marca_peca.toUpperCase(),
					quantidade: item.quantidade,
					preco_unitario: item.preco_unitario,
				})),
			};

			// Chame o backend para atualizar a OS
			if (window.electron) {
				await window.electron.updateServiceOrder(osData);
				showNotification('Ordem de Serviço atualizada com sucesso!', 'success');
				closeEditModal();
				// Atualize a lista de OS
				await fetchServiceOrders();
			} else {
				console.error('Electron API not available');
			}
		} catch (error) {
			console.error('Error updating service order:', error);
			showNotification('Erro ao atualizar OS: ' + error.message, 'error');
		}
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
				on:input={(e) => (searchQuery = e.target.value.toUpperCase())}
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
								{client.nome.toUpperCase()} - {client.cpf}
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
				<h2>OS de {selectedClient.nome.toUpperCase()}</h2>
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
										<button on:click={() => editOS(os)}>Editar</button>
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

	{#if showEditModal}
		<div class="modal-overlay">
			<div class="modal-content">
				<h2>Editar Ordem de Serviço #{editedOS.id}</h2>
				<form on:submit|preventDefault={saveEditedOS}>
					<!-- <div>
						<label>Data:</label>
						<input type="date" bind:value={editedOS.data} />
					</div> -->
					<div>
						<label>Observação:</label>
						<textarea
							rows="4"
							cols="50"
							bind:value={editedOS.observacao}
							style="resize: none;"
						/>
					</div>
					<div>
						<label>Forma de Pagamento:</label>
						<input type="text" bind:value={editedOS.forma_pagamento} />
					</div>
					<h3>Itens</h3>
					<table>
						<thead>
							<tr>
								<th>Nome da Peça</th>
								<th>Marca</th>
								<th>Quantidade</th>
								<th>Preço Unitário</th>
								<th>Ações</th>
							</tr>
						</thead>
						<tbody>
							{#each editedOS.itens as item, index}
								<tr>
									<td>
										<input
											type="text"
											bind:value={item.nome_peca}
											on:input={(e) =>
												updateItem(
													index,
													'nome_peca',
													e.target.value.toUpperCase(),
												)}
										/>
									</td>
									<td>
										<input
											type="text"
											bind:value={item.marca_peca}
											on:input={(e) =>
												updateItem(
													index,
													'marca_peca',
													e.target.value.toUpperCase(),
												)}
										/>
									</td>
									<td>
										<input
											type="number"
											min="0"
											bind:value={item.quantidade}
											on:input={(e) =>
												updateItem(
													index,
													'quantidade',
													parseInt(e.target.value),
												)}
										/>
									</td>
									<td>
										<input
											type="number"
											step="1.00"
											bind:value={item.preco_unitario}
											on:input={(e) =>
												updateItem(
													index,
													'preco_unitario',
													parseFloat(e.target.value),
												)}
										/>
									</td>
									<td>
										<button type="button" on:click={() => removeItem(index)}>
											Remover
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<button type="button" on:click={addItem}>Adicionar Item</button>
					<div class="modal-actions">
						<button type="button" on:click={closeEditModal}>Cancelar</button>
						<button type="submit">Salvar</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if message}
		<div class={`notification ${type}`}>
			{message}
		</div>
	{/if}
</section>

<style lang="scss">
	@import 'src/lib/styles/input.scss';

	section {
		display: grid;
		grid-template-rows: repeat(2, 1fr);
		gap: 1rem;
		width: 100%;
		height: 100%;
		padding: 10px;
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
					background-color: $bgcolor;
					border: 1px solid $bordercolor;
					margin: 0;
					color: $maintextcolor;
					cursor: pointer;

					&.selected {
						background-color: $lighter;
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

	/* Estilos para o modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: #282828;
		padding: 20px;
		border-radius: 10px;
		width: 80%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-content h2 {
		margin-top: 0;
	}

	.modal-content form > div {
		margin-bottom: 10px;
	}

	.modal-content label {
		display: block;
		margin-bottom: 5px;
	}

	.modal-content input,
	.modal-content textarea {
		width: 100%;
		padding: 8px;
		box-sizing: border-box;
		background-color: #333;
		color: #fff;
		border: 1px solid #555;
		border-radius: 5px;
	}

	.modal-content table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 10px;
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
	}

	.modal-content button {
		margin-right: 10px;
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

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 20px;
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

	input[type='text'],
	textarea {
		text-transform: uppercase;
	}
</style>
