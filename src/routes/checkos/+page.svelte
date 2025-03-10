<script>
	import { onMount } from 'svelte';
	import { format } from 'date-fns';
	import SelectList from '$lib/components/ListItem.svelte';
	import ListItem from '$lib/components/ListItem.svelte';
	import Notification from '$lib/components/Notification.svelte';

	let clients = [];

	let searchQuery = '';
	let selectedClientId = null;
	let selectedClient = null;
	let serviceOrders = [];
	let isLoadingClients = false;
	let isLoadingOrders = false;

	let notificationMessage = '';
	let notificationType = 'info';

	let showEditModal = false;
	let osToEdit = null;
	let editedOS = {};

	onMount(() => {
		fetchClients();
	});

	function selectClient(clientId) {
		selectedClientId = clientId;
	}

	async function fetchClients() {
		isLoadingClients = true;
		try {
			if (window.electron) {
				clients = await window.electron.fetchClients();
			} else {
				console.error('Electron API not available');
			}
		} catch (error) {
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
			showNotification('Erro ao buscar OS: ' + error.message, 'error');
		} finally {
			isLoadingOrders = false;
		}
	}

	function formatDate(dateStr) {
		return format(new Date(dateStr), 'dd/MM/yyyy');
	}
	function viewOS(os) {
		const content = generateOSContent(os, true);
		const newWindow = window.open('', '', 'width=800,height=600');
		newWindow.document.write(content);
		newWindow.document.close();
	}

	function printOS(os) {
		const content = generateOSContent(os, false);
		const printWindow = window.open('', '', 'width=1000,height=auto');
		printWindow.document.write(content);
		printWindow.document.close();

		printWindow.onload = () => {
			// Cria e insere um botão para que o usuário acione a impressão manualmente
			const btnPrint = printWindow.document.createElement('button');
			btnPrint.innerText = 'Imprimir';
			btnPrint.style.position = 'fixed';
			btnPrint.style.top = '10px';
			btnPrint.style.right = '10px';
			btnPrint.onclick = () => {
				printWindow.print();
				// Opcional: remova a linha abaixo se não quiser fechar a janela automaticamente
				// printWindow.close();
			};
			printWindow.document.body.insertBefore(btnPrint, printWindow.document.body.firstChild);
		};
	}

	function exportOSToPDF(os) {
		const content = generateOSContent(os, false);
		if (window.electron) {
			window.electron.printToPDF(content);
		} else {
			console.error('Electron API not available');
		}
	}

	function generateOSContent(os, isPreview) {
		const totalValue = os.itens.reduce(
			(sum, item) => sum + item.preco_unitario * item.quantidade,
			0,
		);

		return /* html */ `<!DOCTYPE html>
<html lang="pt-BR">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Auto Mecânica Jorge</title>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<h1>AUTO MECÂNICA JORGE</h1>
				<p>JTCS Auto Mecânica Ltda. - ME</p>
				<p>Rua Virgílio Pedro Rubini, 1670 - Barra do Rio Cerro</p>
				<p>CEP 89260-190 - Jaraguá do Sul - Santa Catarina</p>
				<p>Fone: (47) 3376-0444</p>
			</div>
			<table class="info">
				<tr>
					<td>
						<strong>Cliente:</strong>
						${selectedClient?.nome || 'N/A'}
					</td>
					<td>
						<strong>Data:</strong>
						${formatDate(os.data)}
					</td>
				</tr>
				<tr>
					<td>
						<strong>Fone:</strong>
						${selectedClient?.tel || 'N/A'}
					</td>
					<td>
						<strong>Observações:</strong>
						${os.observacao || 'Nenhuma'}
					</td>
				</tr>
				<tr>
					<td>
						<strong>Carro:</strong>
						${os.marca || 'N/A'}
					</td>
					<td>
						<strong>Modelo:</strong>
						${os.modelo || 'N/A'}
					</td>
				</tr>
				<tr>
					<td colspan="2">
						<strong>Placa:</strong>
						${os.placa || 'N/A'}
					</td>
				</tr>
				${
					isPreview
						? `<tr>
                        <td colspan="2"><strong>Kilometragem:</strong> ${os.os_km || 'N/A'}</td>
                  </tr>`
						: ''
				}
			</table>
			<table class="table">
				<thead>
					<tr>
						<th>Nome da Peça</th>
						<th class="qtt">Quantidade</th>
						<th class="preco">Preço</th>
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
                      </tr>`,
						)
						.join('')}
				</tbody>
			</table>
			<br />
			<div class="signature">
				<div>Assinatura: _______________________________________________</div>
				<div>TOTAL R$ ${totalValue.toFixed(2)}</div>
			</div>
		</div>
	</body>
	<style>
		/* Estilos gerais para tela */
		body {
			font-family: 'Arial', sans-serif;
			background-color: #fff;
			color: #000;
		}
		.container {
			width: 95%;
			height: 95%;
			margin: 0 auto;
			padding: 10px;
			border: 1px solid #333;
		}
		.header {
			text-align: center;
		}
		.header h1 {
			margin: 0;
		}
		.header p {
			margin: 5px 0;
		}
		.info,
		.table {
			width: 100%;
			border-collapse: collapse;
			margin-top: 20px;
		}
		.info td {
			padding: 5px;
		}
		.table th,
		.table td {
			border: 1px solid #000;
			padding: 8px;
			text-align: left;
		}
		.signature {
			margin-top: 20px;
			display: flex;
			justify-content: space-between;
		}
		.qtt {
			width: 100px;
		}
		.preco {
			width: 120px;
		}

		/* Estilos específicos para impressão */
		
	</style>


      </html>
    `;
	}

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
				os_km: editedOS.os_km,
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

	function showNotification(message, type) {
		notificationMessage = message;
		notificationType = type;
		setTimeout(() => {
			notificationMessage = '';
		}, 3000);
	}
</script>

<section class="form-main">
	<h2 class="title-list">Consultar OS:</h2>
	<input
		type="text"
		placeholder="Pesquisar Cliente (Nome, CPF, Telefone)"
		bind:value={searchQuery}
		on:input={(e) => (searchQuery = e.target.value.toUpperCase())}
	/>
	<div class="client-list">
		<div class="list-container">
			<!-- <div style="position: absolute;">teste</div> -->
			<div class="list">
				{#if isLoadingClients}
					<p>Carregando clientes...</p>
				{:else if filteredClients.length > 0}
					{#each filteredClients as client, i}
						<ListItem
							datatype="client"
							index={i}
							display={['#' + client.id, client.nome.toUpperCase(), client.cpf]}
							toggled={client.id === selectedClientId}
							onselect={() => selectClient(client.id)}
						/>
					{/each}
				{:else}
					<p>Nenhum cliente encontrado.</p>
				{/if}
			</div>
		</div>
	</div>

	<div class="service-orders">
		{#if selectedClient}
			<h2 class="title-os">OS de {selectedClient.nome.toUpperCase()}</h2>
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
									<button on:click={() => exportOSToPDF(os)}>Exportar PDF</button>
									<button on:click={() => printOS(os)}>Imprimir OS</button>
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

	{#if showEditModal}
		<div class="modal-overlay">
			<div class="modal-content">
				<h2>Editar Ordem de Serviço #{editedOS.id}</h2>
				<form on:submit|preventDefault={saveEditedOS}>
					<div>
						<label for="">Observação:</label>
						<textarea
							rows="4"
							cols="50"
							bind:value={editedOS.observacao}
							style="resize: none;"
						/>
					</div>
					<div>
						<label for="">Forma de Pagamento:</label>
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

	{#if notificationMessage}
		<div class={`notification ${notificationType}`}>
			{notificationMessage}
		</div>
	{/if}
</section>

<style lang="scss">
	// @import 'src/lib/styles/input.scss';
	@import 'src/lib/styles/mixins.scss';

	.form-main {
		@include container-base;
		display: grid;
		grid-auto-columns: 1fr;
		grid-auto-rows: max-content max-content auto;
		grid-template-areas:
			'a a'
			'b c'
			'd c';
		height: 100%;
		gap: $gap;

		h2 {
			grid-area: a;
			text-align: center;
		}

		input {
			grid-area: b;
			@include form-input;
		}

		.client-list {
			grid-area: d;
			display: grid;
			gap: $gap;
			overflow-y: auto;

			.list-container {
				border: 1px solid $bordercolor;
				border-radius: 5px;
				align-items: start;
				overflow-y: auto;
			}
		}

		.service-orders {
			grid-area: c;
			display: grid;
			grid-template-areas:
				'a'
				'b';
			gap: $gap;
			height: 50px;

			.title-os {
				grid-area: a;
				margin: 0;
			}

			table {
				width: 100%;
				border-collapse: collapse;

				th,
				td {
					border: 1px solid $bordercolor;
					padding: 8px;
					text-align: left;
				}

				th {
					background-color: $bgcolor;
				}

				button {
					background-color: #282828;
					border: 1px solid $bordercolor;
					padding: 5px 10px;
					border-radius: $radiussmall;
					cursor: pointer;

					&:hover {
						background-color: #444;
					}
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
