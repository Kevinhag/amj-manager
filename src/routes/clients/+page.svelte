<script>
	import { onMount } from 'svelte';
	import Notification from '$lib/Notification.svelte'; // Certifique-se de que o caminho está correto

	let clients = [];
	let selectedClient = '';
	let selectedClientData = null;
	let notificationMessage = '';
	let notificationType = '';

	function fetchClients() {
		fetch('http://localhost:3000/api/clients')
			.then((response) => response.json())
			.then((data) => {
				clients = data;
				console.log(data);
			})
			.catch((error) => {
				console.error('Erro ao buscar clientes:', error);
				showNotification('Erro ao buscar clientes', 'error');
			});
	}

	onMount(() => {
		fetchClients();
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

	function addClient() {
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

		fetch('http://localhost:3000/api/insert-client', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(newClient),
		})
			.then((response) => response.json())
			.then((data) => {
				console.log('Cliente adicionado:', data);
				clients = [...clients, data];
				clearForm();
				fetchClients();
				showNotification('Cliente adicionado com sucesso!', 'success');
			})
			.catch((error) => {
				console.error('Erro ao adicionar cliente:', error);
				showNotification('Erro ao adicionar cliente', 'error');
			});
	}

	function updateClient() {
		const updatedClient = {
			id: selectedClientData.id,
			nome: selectedClientData.nome,
			cpf: selectedClientData.cpf,
			endereco: selectedClientData.endereco,
			bairro: selectedClientData.bairro,
			cidade: selectedClientData.cidade,
			numero_casa: selectedClientData.numero_casa,
			complemento: selectedClientData.complemento,
			tel: selectedClientData.tel,
			tel2: selectedClientData.tel2,
		};

		fetch('http://localhost:3000/api/update-client', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(updatedClient),
		})
			.then((response) => response.json())
			.then((data) => {
				clients = clients.map((client) =>
					client.id == selectedClientData.id ? data : client,
				);
				console.log('Cliente atualizado:', data);
				clearForm();
				fetchClients();
				showNotification('Cliente atualizado com sucesso!', 'success');
			})
			.catch((error) => {
				console.error('Erro ao atualizar cliente:', error);
				showNotification('Erro ao atualizar cliente', 'error');
			});
	}

	function deleteClient(client) {
		fetch(`http://localhost:3000/api/delete-client/${client.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then((response) => response.json())
			.then((data) => {
				clients = clients.filter((c) => c.id !== client.id);
				console.log('Cliente deletado:', data);
				clearForm();
				showNotification('Cliente deletado com sucesso!', 'success');
			})
			.catch((error) => {
				console.error('Erro ao deletar cliente:', error);
				showNotification('Erro ao deletar cliente', 'error');
			});
	}

	function showNotification(message, type) {
		notificationMessage = message;
		notificationType = type;
	}

	function clearForm() {
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

	$: selectedClientData = clients.find((client) => client.id == selectedClient);
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
		<div class="client-add">
			<div class="form-client">
				<label for="nome">Nome</label>
				{#if selectedClientData != null}
					<input type="text" id="nome" bind:value={selectedClientData.nome} />
				{:else}
					<input type="text" id="nome" bind:value={nome} />
				{/if}
			</div>
			<div class="form-client">
				<label for="cpf">CPF</label>
				{#if selectedClientData != null}
					<input type="text" id="cpf" bind:value={selectedClientData.cpf} />
				{:else}
					<input type="text" id="cpf" bind:value={cpf} />
				{/if}
			</div>
			<div class="form-client">
				<label for="endereco">Endereço</label>
				{#if selectedClientData != null}
					<input type="text" id="endereco" bind:value={selectedClientData.endereco} />
				{:else}
					<input type="text" id="endereco" bind:value={endereco} />
				{/if}
			</div>
			<div class="form-client">
				<label for="bairro">Bairro</label>
				{#if selectedClientData != null}
					<input type="text" id="bairro" bind:value={selectedClientData.bairro} />
				{:else}
					<input type="text" id="bairro" bind:value={bairro} />
				{/if}
			</div>
			<div class="form-client">
				<label for="cidade">Cidade</label>
				{#if selectedClientData != null}
					<input type="text" id="cidade" bind:value={selectedClientData.cidade} />
				{:else}
					<input type="text" id="cidade" bind:value={cidade} />
				{/if}
			</div>
			<div class="form-client">
				<label for="numero_casa">Número</label>
				{#if selectedClientData != null}
					<input type="text" id="numero_casa" bind:value={selectedClientData.numero_casa}	/>
				{:else}
					<input type="text" id="numero_casa" bind:value={numero_casa} />
				{/if}
			</div>
			<div class="form-client">
				<label for="complemento">Complemento</label>
				{#if selectedClientData != null}
					<input
						type="text"
						id="complemento"
						bind:value={selectedClientData.complemento}
					/>
				{:else}
					<input type="text" id="complemento" bind:value={complemento} />
				{/if}
			</div>
			<div class="form-client">
				<label for="tel">Telefone</label>
				{#if selectedClientData != null}
					<input type="text" id="tel" bind:value={selectedClientData.tel} />
				{:else}
					<input type="text" id="tel" bind:value={tel} />
				{/if}
			</div>
			<div class="form-client">
				<label for="tel2">Telefone 2</label>
				{#if selectedClientData != null}
					<input type="text" id="tel2" bind:value={selectedClientData.tel2} />
				{:else}
					<input type="text" id="tel2" bind:value={tel2} />
				{/if}
			</div>
			<div>
				{#if selectedClientData}
					<button type="button" on:click={updateClient}>Alterar Cliente</button>
					<button type="button" on:click={() => deleteClient(selectedClientData)}>
						Excluir Cliente
					</button>
					<button type="button" on:click={clearForm}>Novo Cliente</button>
				{:else}
					<button type="button" on:click={addClient}>Adicionar Cliente</button>
					<button type="button" disabled>Excluir Cliente</button>
					<button type="button" disabled>Novo Cliente</button>
				{/if}
			</div>
		</div>

		<div class="client-list">
			<select name="clients" id="clients" size="10" bind:value={selectedClient}>
				{#each clients as client (client.id)}
					<option value={client.id}>
						{client.nome} - {client.cpf}
					</option>
				{/each}
			</select>
		</div>
	</div>

	{#if notificationMessage}
		<Notification message={notificationMessage} type={notificationType} />
	{/if}
</section>

<style lang="scss">

	input {
		color: $maintextcolor;
		width: 100%;
		padding: 5px;
		border-radius: 5px;
		border: 1px solid #cccccc33;
	}

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
				border-radius: 10px;
				select {
					height: 100%;
					font: 700 14px 'Roboto Mono', Arial, sans-serif;
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

				.form-client {
					width: 40%;
					display: flex;
					flex-direction: column;
					gap: 5px;

					input {
						font: 700 14px 'Roboto Mono', Arial, sans-serif;
						padding: 5px;
						border-radius: 5px;
						border: 1px solid #cccccc33;
					}
				}
			}
		}
	}
</style>
