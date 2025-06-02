<script>
	import { onMount } from 'svelte';
	import { format, isWithinInterval, parseISO } from 'date-fns';
	import Notification from '$lib/components/Notification.svelte';
	import { text } from '@sveltejs/kit';
	import { blank_object } from 'svelte/internal';

	let reportType = 'client'; // 'daily', 'monthly', 'annual', 'custom', 'client'
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
	let reportHTML = null;

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

		await generateReport();
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
					obsRetifica: item.obsRetifica,
					os_km: item.os_km,

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

	function exportToPDF() {
		if (reportData.length === 0) {
			showNotification('Gere um relatório antes de exportar.', 'info');
			return;
		}
		const content = reportHTML.innerHTML;

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

		{#if isLoading}
			<p>Carregando...</p>
		{/if}

		<div class="report-html" bind:this={reportHTML}>
			{#if reportData.length > 0}
				<div class="report">
					{#if reportData.length > 0}
						<div class="report-content">
							<div class="header">
								<h1>AUTO MECÂNICA JORGE</h1>
								<p>JTCS Auto Mecânica Ltda. - ME</p>
								<p>Rua Virgílio Pedro Rubini, 1670 - Barra do Rio Cerro</p>
								<p>CEP 89260-190 - Jaraguá do Sul - Santa Catarina</p>
								<p>Fone: (47) 3376-0444</p>
							</div>
							{#each reportData as client}
								<div class="client-section">
									<br />
									<div class="separator" />

									<div class="client-info">
										<h2>{client.nome_cliente}</h2>
										<p>Telefone: {client.telefone}</p>
										<p>CPF: {client.cpf}</p>
									</div>

									<div class="separator" />

									{#each client.osList as os}
										<div class="os-section">
											<div>
												<h3>Ordem de Serviço #{os.osId}</h3>
												<h5>Data: {formatDate(os.data)}</h5>
											</div>

											<br />
											<div class="car-info">
												Carro: <span>{os.carro.marca} {os.carro.modelo}</span>
												<br>
												Placa: <span>{os.carro.placa}</span>
												<br>
												KM: <span>{os.os_km}</span>	
											</div>
											<br />
											<table>
												<thead>
													<tr>
														<th>Item</th>
														<th class="qtt">Quantidade</th>
														<th class="preco">Preço Unitário</th>
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

											{#if os.observacao}
												<p>Observação: {os.observacao}</p>
											{/if}
											{#if os.obsRetifica}
												<p>Retífica: {os.obsRetifica}</p>
											{/if}

											<div>
												<p>Forma de Pagamento: {os.formaPagamento}</p>
												<p>Total da OS: R$ {os.valorTotal.toFixed(2)}</p>
											</div>
										</div>
										<div class="separator" />
									{/each}
								</div>
							{/each}
							<h2 class="total-geral">
								Total Geral: R$ {reportData
									.reduce(
										(sum, client) =>
											sum +
											client.osList.reduce(
												(osSum, os) => osSum + os.valorTotal,
												0,
											),
										0,
									)
									.toFixed(2)}
							</h2>
						</div>
					{:else if !isLoading}
						<p>Nenhum dado disponível.</p>
					{/if}
				</div>
			{:else if !isLoading}
				<p>Nenhum dado disponível.</p>
			{/if}
			<style lang="scss">
				:root {
					background-color: white;
				}

				.total-geral {
					text-align: right;
					margin-top: 20px;
					font-size: 16pt;
					font-weight: bold;
				}

				.separator {
					margin: 20px 0 !important;
					width: 100%;
					height: 1px;
					background-color: $lighter;
				}

				.report {
					display: flex;
					align-items: center;
					justify-content: center;
					background-color: white !important;
					width: 100%;
					color: black;
					border: 1px solid $bordercolor;
				}

				.report-content {
					background-color: white !important;
					width: 100%;
					height: 100%;
					padding: 100px;
				}

				.header {
					text-align: center;
					margin-bottom: 20px;
				}

				.header h1 {
					font-size: 26pt;
					margin-bottom: 5px;
				}

				.header p {
					font-size: 12pt;
					font-weight: bold;
					margin: 0;
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

				.client-section {
					margin-bottom: 30px;

					h3 {
						margin-top: 20px;
					}
				}

				.client-info {
					display: flex;
					flex-direction: column;
					align-items: center;
					text-align: center;
				}

				.car-info {
					text-align: center;
					font-size: 12pt;
					margin-top: 5px;
					font-weight: bold;
				}

				.car-info span {
					font-weight: normal;
				}

				h3 {
					text-align: center;
				}

				h5 {
					text-align: center;
					margin-top: 5px;
				}
				.os-section {
					margin-top: 20px;

					h4 {
						margin-bottom: 5px;
					}
				}
				table {
					width: 100%;
					border-collapse: collapse;
					margin-top: 10px;
				}

				th,
				td {
					border: 1px solid $bordercolor !important;
					padding: 5px 10px !important;
					text-align: left;
				}
				th {
					background-color: $bgcolor;
					color: white;
				}
				tr {
					color: black;
					background-color: #22222211;
				}
				tr:nth-child(even) {
					background-color: #22222233;
				}
			</style>
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
		align-items: center;
		gap: 20px;
		width: 100%;
		height: 100%;
	}

	.report-html {
		border: 1px solid $bordercolor;
		border-radius: $radius;
		background-color: $darker;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 70%;
		height: 100%;
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

	.total-geral {
		text-align: right;
		margin-top: 20px;
	}

	p {
		text-align: center;
	}
</style>
