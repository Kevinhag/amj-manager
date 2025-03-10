<script>
	import { onMount } from 'svelte';
	import { format, parseISO } from 'date-fns';
	import Notification from '$lib/components/Notification.svelte';
	import ListItem from '$lib/components/ListItem.svelte';
	import { goto } from '$app/navigation';

	let clients = [];
	let cars = [];
	let ordersByClient = []; // Dados agrupados de OS
	let searchQuery = '';
	let notificationMessage = '';

	// Filtra os clientes conforme o termo de busca
	$: filteredClients = clients.filter((client) => {
		const searchLower = searchQuery.toLowerCase();
		const clientMatch =
			client.nome.toLowerCase().includes(searchLower) ||
			(client.cpf && client.cpf.toLowerCase().includes(searchLower)) ||
			(client.tel && client.tel.toLowerCase().includes(searchLower)) ||
			(client.tel2 && client.tel2.toLowerCase().includes(searchLower));

		const clientCars = cars.filter((car) => car.cliente_id == client.id);
		const carMatch = clientCars.some(
			(car) =>
				(car.modelo && car.modelo.toLowerCase().includes(searchLower)) ||
				(car.placa && car.placa.toLowerCase().includes(searchLower)),
		);
		return clientMatch || carMatch;
	});

	function gotoClient(car) {
		goto(`/clients?clientId=${car.cliente_id}&carId=${car.id}`);
	}

	function formatDate(dateStr) {
		return format(parseISO(dateStr), 'dd/MM/yyyy');
	}

	function getInitials(fullName) {
		return fullName
			.split(' ')
			.map((name) => name[0])
			.join('');
	}

	async function fetchData() {
		try {
			const [clientRes, carRes] = await Promise.all([
				fetch('http://localhost:3000/api/clients'),
				fetch('http://localhost:3000/api/cars'),
			]);

			if (!clientRes.ok || !carRes.ok) {
				throw new Error('Falha ao buscar dados');
			}

			clients = await clientRes.json();
			cars = await carRes.json();

			// Busca as OS utilizando a API de relatório com um intervalo amplo (todos os registros)
			if (window.electron) {
				const currentDate = new Date().toISOString().split('T')[0];
				const requestData = { startDate: '1900-01-01', endDate: currentDate };
				const data = await window.electron.fetchReportData('custom', requestData);
				ordersByClient = groupDataByClient(data);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
			notificationMessage = 'Erro ao buscar dados: ' + error.message;
			setTimeout(() => (notificationMessage = ''), 3000);
		}
	}

	function groupDataByClient(data) {
		const clientMap = {};
		data.forEach((item) => {
			const clientId = item.clientId;
			if (!clientMap[clientId]) {
				clientMap[clientId] = { clientId, osList: [] };
			}
			clientMap[clientId].osList.push({
				osId: item.osId,
				data: item.data,
				valorTotal: item.valorTotal,
				formaPagamento: item.formaPagamento,
				observacao: item.observacao,
				// outros campos, se necessário
			});
		});
		return Object.values(clientMap);
	}

	onMount(fetchData);
</script>

<section class="form-main">
	<h2>Lista:</h2>
	<input
		type="text"
		class="search-input"
		placeholder="Buscar cliente: Nome, CPF, Telefone..."
		bind:value={searchQuery}
	/>
	<div class="client-list-container">
		{#each filteredClients as client (client.id)}
			<div class="client-bar">
				<div class="client-initials">
					<span class="initials">{getInitials(client.nome.toUpperCase())}</span>
				</div>
				<div class="client-info">
					<span class="client-nome">{client.nome.toUpperCase()}</span>
					<span class="client-cpf">{client.cpf}</span>
				</div>
				<div class="client-tels">
					<span class="client-tel">{client.tel}</span>
					{#if client.tel2}
						<span class="client-tel2">{client.tel2}</span>
					{/if}
				</div>
				<span class="client-city">{client.cidade.toUpperCase()}</span>
				<div class="client-cars">
					<div class="cars">
						{#each cars.filter((car) => car.cliente_id == client.id) as car, i}
							<ListItem
								datatype="car"
								index={i}
								display={[car.placa, car.modelo.toUpperCase()]}
								onselect={() => gotoClient(car)}
							/>
						{/each}
					</div>
				</div>

				<div class="client-os">
					{#if ordersByClient.find((r) => r.clientId === client.id)}
						<div class="os">
							{#each ordersByClient.find((r) => r.clientId === client.id).osList as os, j}
								<ListItem
									datatype="os"
									index={j}
									display={['OS #' + os.osId, formatDate(os.data)]}
								/>
							{/each}
						</div>
					{:else}
						<span>Sem OS</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if notificationMessage}
		<Notification message={notificationMessage} type="error" />
	{/if}
</section>

<style lang="scss">
	@import 'src/lib/styles/variables.scss';
	@import 'src/lib/styles/mixins.scss';

	@mixin item-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		height: 100%;
		font-weight: bold;
		// background-color: $bgtestr;
		border-right: 1px solid $bordercolor;
	}

	.form-main {
		@include container-base;
		display: grid;
		grid-template-rows: max-content max-content auto;
		align-items: center;

		h2 {
			text-align: center;
		}

		.search-input {
			@include form-input;
		}

		.client-list-container {
			display: grid;
			gap: $gap;
			padding: 10px 20px;
			// background-color: $bgtestg;
			border-radius: $radius;
			border: 1px solid $bordercolor;
			background-color: $darker;
			height: 100%;
			width: 100%;
			overflow-y: scroll;
		}
	}

	.client-bar {
		display: grid;
		grid-template-areas: 'initials info tel city cars os';
		grid-template-columns: 100px 1.5fr 1fr 0.5fr 1.25fr 1.25fr;
		align-content: center;
		background-color: $lighter;
		border: 1px solid $bordercolor;
		border-radius: $radius;
		transition: background-color 0.2s ease;
		height: 90px;

		&:nth-child(odd) {
			background-color: $bgcolor;
		}

		&:hover {
			background-color: $darkerhover;
			border: 1px solid $color2;
		}

		.client-initials {
			grid-area: initials;
			@include item-bar;
			background-color: $darker;
			border-radius: $radius 0 0 $radius;

			.initials {
				font-size: 2rem;
				font-weight: bold;
				color: $color2;
				background-color: $bgcolor;
				border: 1px solid $bordercolor;
				border-radius: 50%;
				width: 70px;
				height: 70px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}

		.client-info {
			grid-area: info;
			@include item-bar;

			// background-color: $bgtestr;

			.client-nome {
				font-size: 1.5rem;
				font-weight: bold;
				color: $maintextcolor;
			}
			.client-cpf {
				font-size: 0.8rem;
				color: $maintextcolor;
			}
		}

		.client-tels {
			grid-area: tel;
			@include item-bar;

			.client-tel {
				font-size: 1.25rem;
				color: $maintextcolor;
			}
			.client-tel2 {
				font-size: 0.7rem;
				color: $maintextcolor;
				transition: 200ms;

				&:hover {
					font-size: 1rem;
				}
			}
		}

		.client-city {
			grid-area: city;
			@include item-bar;
			font-size: 1.25rem;
		}

		.client-cars {
			grid-area: cars;
			@include item-bar;
			height: 90px;

			.cars {
				display: flex;
				flex-direction: column;
				justify-self: center;
				align-self: center;
				height: 85%;
				width: 85%;
				background-color: $bgcolor;
				overflow-y: auto;
				border: 1px solid $bordercolor;
				box-shadow: 0 0 7px $darker;
			}
		}

		.client-os {
			grid-area: os;
			@include item-bar;
			border: none;
			height: 85px;
			// overflow-y: auto;

			.os {
				display: flex;
				flex-direction: column;
				justify-self: center;
				align-self: center;
				height: 85%;
				width: 85%;
				background-color: $bgcolor;
				overflow-y: auto;
				border: 1px solid $bordercolor;
				box-shadow: 0 0 7px $darker;
			}
		}
	}
</style>
