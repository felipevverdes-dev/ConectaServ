document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/api/atendimentos';
    const form = document.getElementById('appointment-form');
    const appointmentList = document.getElementById('appointment-list');
    const messageContainer = document.getElementById('message-container');
    const submitBtn = document.getElementById('submit-btn');
    const loading = document.getElementById('loading');
    const fields = {
        cliente: document.getElementById('cliente'),
        servico: document.getElementById('servico'),
        data: document.getElementById('data'),
        horario: document.getElementById('horario')
    };

    loadAppointments();

    form.addEventListener('input', (event) => {
        if (event.target instanceof HTMLInputElement) {
            event.target.removeAttribute('aria-invalid');
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage();

        const values = {
            cliente: fields.cliente.value.trim(),
            servico: fields.servico.value.trim(),
            data: fields.data.value,
            horario: fields.horario.value
        };

        if (!validateForm(values)) {
            return;
        }

        const novoAtendimento = {
            cliente: values.cliente,
            servico: values.servico,
            data: values.data,
            horario: values.horario.length === 5 ? `${values.horario}:00` : values.horario
        };

        try {
            setSubmitting(true);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novoAtendimento)
            });

            if (response.ok) {
                showMessage('Atendimento agendado com sucesso!', 'success');
                form.reset();
                await loadAppointments();
                fields.cliente.focus();
                return;
            }

            const fallbackMessage = response.status === 409
                ? 'Já existe um atendimento agendado para este horário.'
                : 'Não foi possível realizar o agendamento. Confira os dados e tente novamente.';
            const responseMessage = await getResponseMessage(response, fallbackMessage);
            showMessage(responseMessage, 'error');
        } catch (error) {
            showMessage('Não foi possível conectar ao servidor. Tente novamente.', 'error');
        } finally {
            setSubmitting(false);
        }
    });

    async function loadAppointments() {
        setLoading(true);

        try {
            const response = await fetch(apiUrl, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                const responseMessage = await getResponseMessage(
                    response,
                    'Não foi possível carregar a agenda. Tente novamente.'
                );
                renderListMessage(responseMessage, 'error');
                return;
            }

            const atendimentos = await response.json();
            if (!Array.isArray(atendimentos)) {
                throw new Error('Formato inesperado na resposta da agenda.');
            }

            renderAppointments(atendimentos);
        } catch (error) {
            renderListMessage('Não foi possível carregar a agenda. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    }

    function renderAppointments(atendimentos) {
        if (atendimentos.length === 0) {
            renderListMessage('Nenhum atendimento cadastrado.');
            return;
        }

        const fragment = document.createDocumentFragment();

        atendimentos.forEach((atendimento) => {
            const item = document.createElement('li');
            item.className = 'appointment-item';

            const info = document.createElement('div');
            info.className = 'appointment-info';

            const cliente = document.createElement('h3');
            cliente.textContent = atendimento.cliente || 'Cliente não informado';

            const servico = document.createElement('p');
            servico.textContent = atendimento.servico || 'Serviço não informado';

            const status = document.createElement('span');
            status.className = 'status-badge';
            status.textContent = atendimento.status || 'Agendado';

            info.append(cliente, servico, status);

            const dateTime = document.createElement('div');
            dateTime.className = 'appointment-datetime';

            const data = document.createElement('time');
            data.className = 'date';
            data.dateTime = atendimento.data || '';
            data.textContent = formatDate(atendimento.data);

            const horario = document.createElement('time');
            horario.className = 'time';
            horario.dateTime = atendimento.horario || '';
            horario.textContent = formatTime(atendimento.horario);

            dateTime.append(data, horario);
            item.append(info, dateTime);
            fragment.appendChild(item);
        });

        appointmentList.replaceChildren(fragment);
    }

    function validateForm(values) {
        const invalidFields = Object.entries(fields).filter(([name, field]) => {
            const invalid = !values[name] || !field.checkValidity();
            field.setAttribute('aria-invalid', String(invalid));
            return invalid;
        });

        if (invalidFields.length === 0) {
            return true;
        }

        showMessage('Preencha todos os campos obrigatórios.', 'error');
        invalidFields[0][1].focus();
        return false;
    }

    function setSubmitting(isSubmitting) {
        submitBtn.disabled = isSubmitting;
        submitBtn.textContent = isSubmitting ? 'Agendando...' : 'Agendar';
        form.setAttribute('aria-busy', String(isSubmitting));
    }

    function setLoading(isLoading) {
        loading.hidden = !isLoading;
        appointmentList.hidden = isLoading;
        appointmentList.setAttribute('aria-busy', String(isLoading));
    }

    function renderListMessage(text, type = 'empty') {
        const message = document.createElement('li');
        message.className = type === 'error' ? 'list-error' : 'empty-state';
        message.setAttribute('role', type === 'error' ? 'alert' : 'status');
        message.textContent = text;
        appointmentList.replaceChildren(message);
    }

    function formatDate(value) {
        if (typeof value !== 'string') {
            return 'Data não informada';
        }

        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (!match) {
            return value;
        }

        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
    }

    function formatTime(value) {
        if (typeof value !== 'string') {
            return 'Horário não informado';
        }

        const match = /^(\d{2}):(\d{2})/.exec(value);
        return match ? `${match[1]}:${match[2]}` : value;
    }

    async function getResponseMessage(response, fallbackMessage) {
        try {
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('json')) {
                const body = await response.json();
                if (body && typeof body.mensagem === 'string' && body.mensagem.trim()) {
                    return body.mensagem;
                }
                if (body && typeof body.title === 'string' && body.title.trim()) {
                    return body.title;
                }

                const validationMessages = body?.errors
                    ? Object.values(body.errors).flat().filter((message) => typeof message === 'string')
                    : [];
                if (validationMessages.length > 0) {
                    return validationMessages.join(' ');
                }
            } else {
                const body = (await response.text()).trim();
                if (body) {
                    return body;
                }
            }
        } catch (error) {
            return fallbackMessage;
        }

        return fallbackMessage;
    }

    function clearMessage() {
        messageContainer.replaceChildren();
    }

    function showMessage(text, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.setAttribute('role', type === 'error' ? 'alert' : 'status');
        alert.textContent = text;
        messageContainer.replaceChildren(alert);
    }
});
