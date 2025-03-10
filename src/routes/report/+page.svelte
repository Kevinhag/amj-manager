<script>
	import { onMount } from 'svelte';
	import { format, parseISO } from 'date-fns';
	import Notification from '$lib/components/Notification.svelte';

	let reportType = 'daily'; // 'daily', 'monthly', 'annual', 'custom', 'client'
	let selectedDate = '';
	let selectedMonth = '';
	let selectedYear = new Date().getFullYear();
	let startDate = '';
	let endDate = '';
	let reportData = [];
	let isLoading = false;
	let message = '';
	let type = 'info'; // 'info', 'error', 'success'
	let clients = [];
	let selectedClientId = null;

	onMount(async () => {

		const today = new Date();
		selectedDate = today.toISOString().split('T')[0];
		selectedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
		startDate = selectedDate;
		endDate = selectedDate;

		if (window.electron) {
			try {
				clients = await window.electron.fetchClients();
				if (clients.length > 0) {
					selectedClientId = clients[0].id;
				}
			} catch (error) {
				console.error('Error fetching clients:', error);
				showNotification('Erro ao carregar clientes: ' + error.message, 'error');
			}
		}
	});

	async function generateReport() {
		isLoading = true;
		reportData = [];
		try {
			if (window.electron) {
				const requestData = {
					date: selectedDate,
					month: selectedMonth,
					year: selectedYear,
					startDate,
					endDate,
					clientId: selectedClientId,
				};

				const data = await window.electron.fetchReportData(reportType, requestData);

				reportData = groupDataByClient(data);

				if (reportData.length === 0) {
					showNotification('Nenhum dado disponível para o período selecionado.', 'info');
				}
			} else {
				console.error('Electron API not available');
			}
		} catch (error) {
			console.error('Error fetching report data:', error);
			showNotification('Erro ao gerar relatório: ' + error.message, 'error');
		} finally {
			isLoading = false;
		}
	}

	function groupDataByClient(data) {
		const clientMap = {};

		data.forEach((item) => {
			const clientId = item.clientId;

			if (!clientMap[clientId]) {
				clientMap[clientId] = {
					clientId,
					nome_cliente: item.nome_cliente,
					cpf: item.cpf,
					telefone: item.telefone,
					osList: {},
				};
			}

			const osId = item.osId;

			if (!clientMap[clientId].osList[osId]) {
				clientMap[clientId].osList[osId] = {
					osId,
					data: item.data,
					valorTotal: item.valorTotal,
					formaPagamento: item.formaPagamento,
					observacao: item.observacao,
					carro: {
						modelo: item.carro_modelo,
						marca: item.carro_marca,
						placa: item.carro_placa,
					},
					itens: [],
				};
			}

			if (item.itemId) {
				clientMap[clientId].osList[osId].itens.push({
					itemId: item.itemId,
					nome: item.item_nome,
					quantidade: item.quantidade,
					preco: item.preco,
				});
			}
		});

		return Object.values(clientMap).map((client) => {
			client.osList = Object.values(client.osList);
			return client;
		});
	}

	function formatDate(dateStr) {
		return format(parseISO(dateStr), 'dd/MM/yyyy');
	}

	function generateReportHTML() {
		const totalGeral = reportData.reduce(
			(sum, client) => sum + client.osList.reduce((osSum, os) => osSum + os.valorTotal, 0),
			0,
		);

		const clientSections = reportData
			.map(
				(client) => `
		<title>Auto Mecânica Jorge</title>
		<h1>Relatório ${getReportTitle()}</h1>
		<h3>${client.nome_cliente}</h3>
		<p>Telefone: ${client.telefone}</p>
		<p>CPF: ${client.cpf}</p>
		${client.osList
			.map(
				(os) => `
		  <h4>Ordem de Serviço #${os.osId}</h4>
		  <p>Data: ${formatDate(os.data)}</p>
		  <p>Carro: ${os.carro.marca} ${os.carro.modelo} - Placa: ${os.carro.placa}</p>
		  <p>Forma de Pagamento: ${os.formaPagamento}</p>
		  ${os.observacao ? `<p>Observação: ${os.observacao}</p>` : ''}
		  ${
				os.itens.length > 0
					? `
		  <table>
			<thead>
			  <tr>
				<th>Item</th>
				<th>Quantidade</th>
				<th>Preço Unitário</th>
				<th>Total</th>
			  </tr>
			</thead>
			<tbody>
			  ${os.itens
					.map(
						(item) => `
				<tr>
				  <td>${item.nome}</td>
				  <td>${item.quantidade}</td>
				  <td>R$ ${item.preco.toFixed(2)}</td>
				  <td>R$ ${(item.quantidade * item.preco).toFixed(2)}</td>
				</tr>
			  `,
					)
					.join('')}
			</tbody>
		  </table>
		  `
					: ''
			}
		  <p>Total da OS: R$ ${os.valorTotal.toFixed(2)}</p>
		`,
			)
			.join('')}
	  `,
			)
			.join('');

		return `
		<html lang="pt-BR">
		<head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
		  <title>Auto Mecânica Jorge</title>
		  <style>
			body { font-family: 'Roboto', sans-serif; margin: 20px; }
			h1 { text-align: center; }
			h3 { margin-top: 30px; }
			h4 { margin-top: 20px; }
			table { width: 100%; border-collapse: collapse; margin-top: 10px; }
			th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
			th { background-color: #f2f2f2; }
			.total-geral { text-align: right; margin-top: 20px; font-size: 1.2em; }
		  </style>
		</head>
		<body>
		  <h1>Relatório ${getReportTitle()}</h1>
		  ${clientSections}
		  <h2 class="total-geral">Total Geral: R$ ${totalGeral.toFixed(2)}</h2>
		</body>
		</html>
	  `;
	}

	function getReportTitle() {
		switch (reportType) {
			case 'daily':
				return `Diário - ${formatDate(selectedDate)}`;
			case 'monthly':
				return `Mensal - ${selectedMonth}`;
			case 'annual':
				return `Anual - ${selectedYear}`;
			case 'custom':
				return `De ${formatDate(startDate)} até ${formatDate(endDate)}`;
			case 'client':
				const selectedClient = clients.find((client) => client.id === selectedClientId);
				return `Cliente - ${selectedClient ? selectedClient.nome : ''}`;
			default:
				return '';
		}
	}

	function exportToPDF() {
		if (reportData.length === 0) {
			showNotification('Gere um relatório antes de exportar.', 'info');
			return;
		}
		const content = generateReportHTML();
		if (window.electron) {
			window.electron.printToPDF(content);
		} else {
			console.error('Electron API not available');
		}
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
	<div class="report-container">
		<h2>Relatórios</h2>

		<div class="report-options">
			<label>
				<input type="radio" name="reportType" value="daily" bind:group={reportType} />
				Diário
			</label>
			<label>
				<input type="radio" name="reportType" value="monthly" bind:group={reportType} />
				Mensal
			</label>
			<label>
				<input type="radio" name="reportType" value="annual" bind:group={reportType} />
				Anual
			</label>
			<label>
				<input type="radio" name="reportType" value="custom" bind:group={reportType} />
				Personalizado
			</label>
			<label>
				<input type="radio" name="reportType" value="client" bind:group={reportType} />
				Cliente
			</label>
		</div>

		<div class="date-inputs">
			{#if reportType === 'daily'}
				<label for="date">Data:</label>
				<input type="date" id="date" bind:value={selectedDate} />
			{/if}

			{#if reportType === 'monthly'}
				<label for="month">Mês:</label>
				<input type="month" id="month" bind:value={selectedMonth} />
			{/if}

			{#if reportType === 'annual'}
				<label for="year">Ano:</label>
				<select id="year" bind:value={selectedYear}>
					{#each Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i) as year}
						<option value={year}>{year}</option>
					{/each}
				</select>
			{/if}

			{#if reportType === 'custom'}
				<div class="custom-date-range">
					<label for="start-date">
						Início:
						<input type="date" id="start-date" bind:value={startDate} />
					</label>
					<label for="end-date">
						Fim:
						<input type="date" id="end-date" bind:value={endDate} />
					</label>
				</div>
			{/if}

			{#if reportType === 'client'}
				<label for="client-select">Cliente:</label>
				<select id="client-select" bind:value={selectedClientId}>
					{#each clients as client (client.id)}
						<option value={client.id}>
							{client.nome}
						</option>
					{/each}
				</select>
			{/if}
		</div>

		<div class="buttons">
			<button class="primary-button" on:click={generateReport} disabled={isLoading}>
				{isLoading ? 'Gerando...' : 'Gerar Relatório'}
			</button>
			<button class="secondary-button" on:click={exportToPDF}>Exportar PDF</button>
		</div>

		{#if message}
			<Notification {message} {type} />
		{/if}

		<div class="report">
			{#if reportData.length > 0}
				<div class="report-content">
					{#each reportData as client}
						<div class="client-section">
							<h3>{client.nome_cliente}</h3>
							<p>Telefone: {client.telefone}</p>
							<p>CPF: {client.cpf}</p>

							{#each client.osList as os}
								<div class="os-section">
									<h4>Ordem de Serviço #{os.osId}</h4>
									<p>Data: {formatDate(os.data)}</p>
									<p>
										Carro: {os.carro.marca}
										{os.carro.modelo} - Placa: {os.carro.placa}
									</p>
									<p>Forma de Pagamento: {os.formaPagamento}</p>
									{#if os.observacao}
										<p>Observação: {os.observacao}</p>
									{/if}

									{#if os.itens.length > 0}
										<table>
											<thead>
												<tr>
													<th>Item</th>
													<th>Quantidade</th>
													<th>Preço Unitário</th>
													<th>Total</th>
												</tr>
											</thead>
											<tbody>
												{#each os.itens as item}
													<tr>
														<td>{item.nome}</td>
														<td>{item.quantidade}</td>
														<td>R$ {item.preco.toFixed(2)}</td>
														<td>
															R$ {(
																item.quantidade * item.preco
															).toFixed(2)}
														</td>
													</tr>
												{/each}
											</tbody>
										</table>
									{/if}

									<p>Total da OS: R$ {os.valorTotal.toFixed(2)}</p>
								</div>
							{/each}
						</div>
					{/each}
					<h2 class="total-geral">
						Total Geral: R$ {reportData
							.reduce(
								(sum, client) =>
									sum +
									client.osList.reduce((osSum, os) => osSum + os.valorTotal, 0),
								0,
							)
							.toFixed(2)}
					</h2>
				</div>
			{:else if !isLoading}
				<p>Nenhum dado disponível.</p>
			{/if}
		</div>
	</div>
</section>

<style lang="scss">
	@import 'src/lib/styles/buttons.scss';
	@import 'src/lib/styles/select.scss';
	@import 'src/lib/styles/mixins.scss';

	section {
		@include container-base;
	}

	.report-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
		height: 100%;

		.report {
			background-color: $darker;
			border: 1px solid $bordercolor;
			border-radius: $radius;
			// padding: 20px;
			overflow-y: hidden;

			display: flex;
			flex-direction: column;
			gap: 20px;
			width: 70%;
			height: 100%;

			.report-content {
				background-color: white;
				color: black;
				overflow-y: auto;
				max-width: 60%;
				max-height: 100%;
				border: 1px solid $color2;
				border-radius: $radius;
				padding: 10px;
			}
		}
	}

	h2 {
		text-align: center;
	}

	.report-options {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
		justify-content: center;

		label {
			display: flex;
			align-items: center;
			gap: 5px;
		}

		input[type='radio'] {
			accent-color: $color2;
		}
	}

	.date-inputs {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;

		label {
			display: flex;
			align-items: center;
			gap: 5px;
		}

		input[type='date'],
		input[type='month'],
		select {
			height: 40px;
			width: 200px;
			background-color: $darker;
			color: $maintextcolor;
			border: 1px solid $bordercolor;
			border-radius: $radius;
			padding: 10px;
		}
	}

	.custom-date-range {
		display: flex;
		gap: 20px;
	}

	.buttons {
		display: flex;
		gap: 10px;
		justify-content: center;
	}

	.client-section {
		margin-bottom: 30px;

		h3 {
			margin-top: 20px;
		}

		.os-section {
			margin-top: 20px;

			h4 {
				margin-bottom: 5px;
			}

			table {
				width: 100%;
				border-collapse: collapse;
				margin-top: 10px;
				color: $maintextcolor;

				th,
				td {
					border: 1px solid $bordercolor;
					padding: 8px;
					text-align: left;
				}

				th {
					background-color: $bgcolor;
				}

				tr:nth-child(even) {
					background-color: $darker;
				}
			}
		}
	}

	.total-geral {
		text-align: right;
		margin-top: 20px;
	}

	p {
		text-align: center;
	}
</style>
