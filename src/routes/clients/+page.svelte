<script>
	import { onMount } from 'svelte';

	let clients = [];
	let selectedClient;
	let selectedClientData;

	$: selectedClientData = clients.find((client) => client.id == selectedClient);

	onMount(() => {
		fetch('http://localhost:3000/api/clients')
			.then((response) => response.json())
			.then((data) => {
				clients = data;
				console.log(data);
			});
	});

	let nome = '';
	let cpf = '';
	let endereco = '';
	let bairro = '';
	let cidade = '';
	let numero_casa = '';
	let complemento = '';
	let tel = '';
	let tel2 = '';

	function handleSubmit() {
		const newClient = {
			nome,
			cpf,
			endereco,
			bairro,
			cidade,
			numero_casa,
			complemento,
			tel,
			tel2,
		};

		fetch('http://localhost:3000/api/clients', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(newClient),
		})
			.then((response) => response.json())
			.then((data) => {
				console.log('Client added:', data);
				clients = [...clients, data];
				resetForm();
				alert('Cliente adicionado com sucesso!');
			})
			.catch((error) => {
				console.error('Error adding client:', error);
			});
	}

	function resetForm() {
		nome = '';
		cpf = '';
		endereco = '';
		bairro = '';
		cidade = '';
		numero_casa = '';
		complemento = '';
		tel = '';
		tel2 = '';
		selectedClient = null;
		selectedClientData = null;
	}
</script>

<section>
	<div class="title">
		<div>
			<h2>Adicionar Cliente</h2>
		</div>
		<div>
			<h2>Lista de Clientes</h2>
		</div>
	</div>
	<div class="main">
		<form class="client-add" on:submit|preventDefault={handleSubmit}>
			<div class="form-person">
				<label for="name">Nome</label>
				<input type="text" id="name" bind:value={nome} required />
			</div>
			<div class="form-person">
				<label for="cpf">CPF</label>
				<input type="text" id="cpf" bind:value={cpf} required />
			</div>
			<div class="form-person">
				<label for="endereco">Endereço</label>
				<input type="text" id="endereco" bind:value={endereco} required />
			</div>
			<div class="form-person">
				<label for="bairro">Bairro</label>
				<input type="text" id="bairro" bind:value={bairro} required />
			</div>
			<div class="form-person">
				<label for="cidade">Cidade</label>
				<input type="text" id="cidade" bind:value={cidade} required />
			</div>
			<div class="form-person">
				<label for="numero_casa">Número</label>
				<input type="text" id="numero_casa" bind:value={numero_casa} required />
			</div>
			<div class="form-person">
				<label for="complemento">Complemento</label>
				<input type="text" id="complemento" bind:value={complemento} />
			</div>
			<div class="form-person">
				<label for="tel">Telefone</label>
				<input type="text" id="tel" bind:value={tel} required />
			</div>
			<div class="form-person">
				<label for="tel2">Telefone 2</label>
				<input
					type="text"
					id="tel2"
					bind:value={tel2}
					pattern="^(\+\d{1, 2}\s?)?(\(\d{1, 4}\)\s?)?(\d{1, 2}-?)?(\d{8,9})$"
				/>
			</div>
			<div>
				<button type="submit">Adicionar Cliente</button>
				<button type="button" on:click={resetForm}>Novo Cliente</button>
			</div>
		</form>

		<div class="client-list">
			<select name="clients" id="clients" size="5" bind:value={selectedClient}>
				{#if clients.length === 0}
					<option>Nenhum item encontrado</option>
				{:else}
					{#each clients as client (client.id)}
						<option value={client.id}>{client.nome} - {client.cpf}</option>
					{/each}
				{/if}
			</select>
		</div>
	</div>
</section>

<style lang="scss">
	section {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		justify-content: center;
		align-items: center;

		.title {
			display: grid;
			grid-template-columns: 1fr 1fr;
			width: 100%;
			height: 80px;
			gap: 20px;
			> * {
				display: flex;
				justify-content: center;
				align-items: center;
				height: 100%;
				width: 100%;
				padding: 10px;
			}
		}

		.main {
			display: grid;
			grid-template-columns: 1fr 1fr;
			justify-content: space-evenly;
			gap: 20px;
			align-items: end;
			width: 100%;
			height: 100%;
			> * {
				width: 100%;
				height: 100%;
			}

			.client-list {
				display: flex;
				flex-direction: column;
				justify-content: center;
				height: 100%;
				border: 1px solid #cccccc33;
				border-radius: $radius;
				select {
					height: 100%;
					font: 700 14px 'Roboto Mono', Arial, sans-serif;
				}
				#clients {
					width: 100%;
					height: 100%;
				}
			}
			.client-add {
				display: flex;
				justify-content: center;
				align-items: center;
				background-color: #44444433;
				flex-wrap: wrap;
				width: 100%;
				height: 100%;
				gap: 10px;
				padding: 20px;
				border: 1px solid #cccccc33;
				border-radius: 10px;

				.form-person {
					width: 40%;
					display: flex;
					flex-direction: column;
					gap: 5px;
					label {
						color: $maintextcolor;
					}
					input {
						font: 700 14px 'Roboto Mono', Arial, sans-serif;
						padding: 5px;
						border-radius: 5px;
						border: 1px solid #cccccc33;
					}
				}
				#name {
					width: 100%;
				}
			}
		}
	}
</style>
