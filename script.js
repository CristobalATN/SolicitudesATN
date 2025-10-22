// Función para validar RUT chileno
function validarRut(rut) {
    // Eliminar puntos y guión
    rut = rut.replace(/\./g, '').replace('-', '');
    
    // Obtener dígito verificador
    const dv = rut.slice(-1);
    const rutNumero = parseInt(rut.slice(0, -1), 10);
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    // Convertir RUT a string para iterar sobre sus dígitos
    let rutString = rutNumero.toString();
    
    // Iterar de derecha a izquierda
    for (let i = rutString.length - 1; i >= 0; i--) {
        suma += parseInt(rutString.charAt(i), 10) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    let dvCalculado;
    
    if (dvEsperado === 11) {
        dvCalculado = '0';
    } else if (dvEsperado === 10) {
        dvCalculado = 'K';
    } else {
        dvCalculado = dvEsperado.toString();
    }
    
    return dvCalculado.toLowerCase() === dv.toLowerCase();
}

// Función para formatear automáticamente RUT mientras se escribe
function formatRutInput(input) {
    // Guardar la posición del cursor y la longitud anterior para restaurarla correctamente
    let cursorPosition = 0;
    let previousLength = 0;
    
    // Función auxiliar para formatear el RUT correctamente
    function formatRut(value) {
        // Eliminar puntos y guión
        value = value.replace(/\./g, '').replace('-', '');
        
        // Obtener solo números y la letra K (mayúscula o minúscula)
        value = value.replace(/[^\dkK]/g, '');
        
        // Separar el dígito verificador
        let dv = '';
        if (value.length > 0) {
            dv = value.slice(-1);
            value = value.slice(0, -1);
        }
        
        // Formatear con puntos
        let formattedValue = '';
        let i = value.length;
        
        while (i > 0) {
            const chunk = i >= 3 ? value.slice(i - 3, i) : value.slice(0, i);
            formattedValue = chunk + (formattedValue ? '.' + formattedValue : '');
            i -= 3;
        }
        
        // Añadir el guión y el dígito verificador
        if (dv) {
            formattedValue += '-' + dv;
        }
        
        return formattedValue;
    }
    
    input.addEventListener('input', function(e) {
        try {
            // Guardar la posición del cursor antes de modificar el valor
            cursorPosition = this.selectionStart;
            previousLength = this.value.length;
            
            // Obtener el valor formateado
            const formattedValue = formatRut(this.value);
            
            // Actualizar el valor del input
            this.value = formattedValue;
            
            // Calcular la nueva posición del cursor
            let newPosition = cursorPosition;
            
            // Ajustar la posición si se añadieron caracteres (puntos o guión)
            if (formattedValue.length > previousLength) {
                const addedChars = formattedValue.length - previousLength;
                newPosition = Math.min(cursorPosition + addedChars, formattedValue.length);
            }
            
            // Establecer la nueva posición del cursor
            if (typeof this.setSelectionRange === 'function') {
                this.setSelectionRange(newPosition, newPosition);
            }
        } catch (error) {
            console.warn('Error al formatear RUT:', error);
        }
    });
    
    // También manejar el pegado para formatear inmediatamente
    input.addEventListener('paste', function(e) {
        // Pequeño retraso para permitir que el evento de pegado complete
        setTimeout(() => {
            try {
                // Formatear el valor pegado
                this.value = formatRut(this.value);
            } catch (error) {
                console.warn('Error al formatear RUT pegado:', error);
            }
        }, 0);
    });
}

// Función para validar formato de email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Función para formatear fecha en formato DD-MM-YYYY
function formatearFechaEnvio() {
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}-${mes}-${año}`;
}

// Función para validar campos de observaciones obligatorios
function validarObservacionesObligatorias(inputId, nombreCampo = 'observaciones') {
    const input = document.getElementById(inputId);
    if (!input || !input.value.trim()) {
        alert(`Por favor, completa el campo de ${nombreCampo}.`);
        return false;
    }
    return true;
}

// Variables globales
let exhibicionesData = [];
let editingIndex = -1;
let currentStep = 'validacion-inicial';

// Variables globales para almacenar datos de validación inicial
let validacionInicialData = {
    rut: '',
    tipoUsuario: '',
    emailValidacion: ''
};

// Variables globales para funciones
let navigateToStepGlobal = null;
let resetFormGlobal = null;

// Función para enviar datos a Power Automate
function enviarDatosAPowerAutomate(datos, tipoSolicitud) {
    const powerAutomateUrl = 'https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/971fb86a29204a7aaaa83de432406db9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=09izjqz5nu4vqRe_PDvYq9iyx2r2WWSUrZqhwWTARSc';
    
    // Combinar datos del formulario con datos de validación inicial
    const datosCompletos = {
        ...datos,
        rut: validacionInicialData.rut || '',
        tipoUsuario: validacionInicialData.tipoUsuario || '',
        emailValidacion: validacionInicialData.emailValidacion || ''
    };
    
    // Agregar logging para debug
    console.log('Enviando datos:', JSON.stringify({
        tipoSolicitud: tipoSolicitud,
        datos: datosCompletos,
        fechaEnvio: formatearFechaEnvio()
    }, null, 2));
    
    // Mostrar indicador de carga
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div><p>Enviando solicitud...</p>';
    loadingIndicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
    `;
    document.body.appendChild(loadingIndicator);
    
    fetch(powerAutomateUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tipoSolicitud: tipoSolicitud,
            datos: datosCompletos,
            fechaEnvio: formatearFechaEnvio()
        })
    })
    .then(response => {
        document.body.removeChild(loadingIndicator);
        
        // Agregar logging para debug
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (response.ok) {
            alert('Su solicitud ha sido enviada con éxito. Nos pondremos en contacto con usted a la brevedad.');
            // Usar las funciones globales si están disponibles
            if (navigateToStepGlobal) {
                navigateToStepGlobal('inicio');
            }
            if (resetFormGlobal) {
                resetFormGlobal();
            }
        } else {
            // Intentar obtener más información del error
            response.text().then(errorText => {
                console.error('Error response body:', errorText);
                alert('Ha ocurrido un error al enviar su solicitud. Por favor, inténtelo nuevamente más tarde.');
            });
            console.error('Error al enviar datos:', response.status);
        }
    })
    .catch(error => {
        document.body.removeChild(loadingIndicator);
        alert('Ha ocurrido un error al enviar su solicitud. Por favor, inténtelo nuevamente más tarde.');
        console.error('Error al enviar datos:', error);
    });
}

// Función para formatear automáticamente fechas mientras se escribe
function formatDateInput(input) {
    // Guardar la posición del cursor y la longitud anterior para restaurarla correctamente
    let cursorPosition = 0;
    let previousLength = 0;
    
    // Función auxiliar para formatear la fecha correctamente
    function formatDate(value) {
        // Asegurarse de que solo tenemos dígitos
        value = value.replace(/\D/g, '');
        
        // Limitar a 8 dígitos (ddmmyyyy)
        if (value.length > 8) {
            value = value.slice(0, 8);
        }
        
        // Formatear con guiones
        let formattedValue = value;
        
        if (value.length >= 5) {
            // Formato completo dd-mm-yyyy o parcial dd-mm-y...
            formattedValue = value.substring(0, 2) + '-' + value.substring(2, 4) + '-' + value.substring(4);
        } else if (value.length >= 3) {
            // Formato parcial dd-m...
            formattedValue = value.substring(0, 2) + '-' + value.substring(2);
        }
        
        return formattedValue;
    }
    
    input.addEventListener('input', function(e) {
        // Verificar que el input no sea de tipo hidden antes de continuar
        if (this.type === 'hidden') return;
        
        try {
            // Guardar la posición del cursor antes de modificar el valor
            cursorPosition = this.selectionStart;
            previousLength = this.value.length;
            
            // Obtener el valor formateado
            const formattedValue = formatDate(this.value);
            
            // Actualizar el valor del input
            this.value = formattedValue;
            
            // Solo intentar establecer la selección si el elemento no es de tipo hidden
            if (this.type !== 'hidden' && typeof this.setSelectionRange === 'function') {
                // Calcular la nueva posición del cursor
                let newPosition = cursorPosition;
                
                // Ajustar la posición si se añadieron guiones
                if (cursorPosition === 2 && formattedValue.charAt(2) === '-') {
                    // Si el cursor está después del día y hay un guión, moverlo después del guión
                    newPosition = 3;
                } else if (cursorPosition === 5 && formattedValue.charAt(5) === '-') {
                    // Si el cursor está después del mes y hay un guión, moverlo después del guión
                    newPosition = 6;
                } else if (formattedValue.length > previousLength) {
                    // Si se añadieron caracteres (guiones), ajustar la posición
                    const addedChars = formattedValue.length - previousLength;
                    newPosition = Math.min(cursorPosition + addedChars, formattedValue.length);
                }
                
                // Establecer la nueva posición del cursor
                this.setSelectionRange(newPosition, newPosition);
            }
        } catch (error) {
            console.warn('Error al formatear fecha:', error);
        }
    });
    
    // También manejar el pegado para formatear inmediatamente
    input.addEventListener('paste', function(e) {
        // Verificar que el input no sea de tipo hidden antes de continuar
        if (this.type === 'hidden') return;
        
        // Pequeño retraso para permitir que el evento de pegado complete
        setTimeout(() => {
            try {
                // Formatear el valor pegado
                this.value = formatDate(this.value);
            } catch (error) {
                console.warn('Error al formatear fecha pegada:', error);
            }
        }, 0);
    });
}

// Función auxiliar para convertir fecha en formato dd-mm-yyyy a objeto Date
function convertirFechaADate(fechaStr) {
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // Los meses en JavaScript van de 0 a 11
        const año = parseInt(partes[2], 10);
        return new Date(año, mes, dia);
    }
    return null;
}

// Función para inicializar el formateo de RUT en campos correspondientes
function initializeRutFormatting() {
    // Seleccionar todos los inputs que tengan placeholder con formato de RUT o contengan "rut" en su id o name
    const rutInputs = document.querySelectorAll('input[placeholder*="RUT"], input[id*="rut"], input[name*="rut"], input[id*="Rut"], input[name*="Rut"]');
    
    if (rutInputs.length > 0) {
        console.log('Inicializando formateo de RUT en', rutInputs.length, 'campos');
        
        rutInputs.forEach(input => {
            // Aplicar formateo automático mientras se escribe
            formatRutInput(input);
        });
    } else {
        console.warn('No se encontraron campos de RUT para inicializar formateo');
    }
}

// Función para inicializar datepickers en campos de fecha
function initializeDatepickers() {
    // Seleccionar todos los inputs que tengan placeholder con formato de fecha o sean de tipo date
    const dateInputs = document.querySelectorAll('input[placeholder*="dd-mm-yyyy"], input[placeholder*="dd/mm/yyyy"], input[type="date"], input[id*="fecha"]');
    
    if (dateInputs.length > 0) {
        console.log('Inicializando datepickers en', dateInputs.length, 'campos');
        
        dateInputs.forEach(input => {
            // Aplicar formateo automático mientras se escribe
            formatDateInput(input);
            
            // Asegurarse de que flatpickr esté disponible
            if (typeof flatpickr === 'function') {
                try {
                    // Configurar flatpickr en español
                    if (flatpickr.l10ns && flatpickr.l10ns.es) {
                        flatpickr.localize(flatpickr.l10ns.es);
                    }
                    
                    // Configuración para que flatpickr no interfiera con el formateo manual
                    flatpickr(input, {
                        dateFormat: "d-m-Y",
                        allowInput: true,
                        // Desactivar altInput para evitar que cree un campo oculto
                        altInput: false,
                        disableMobile: true,
                        // Función personalizada para analizar fechas en formato dd-mm-yyyy
                        parseDate: (datestr) => {
                            if (!datestr) return undefined;
                            
                            // Verificar si la fecha tiene el formato dd-mm-yyyy
                            const match = datestr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
                            if (match) {
                                const day = parseInt(match[1], 10);
                                const month = parseInt(match[2], 10) - 1; // Meses en JS son 0-11
                                const year = parseInt(match[3], 10);
                                return new Date(year, month, day);
                            }
                            
                            // Si no coincide con el formato, intentar con Date.parse
                            return new Date(datestr);
                        },
                        onReady: function(selectedDates, dateStr, instance) {
                            // Añadir clase para estilos personalizados
                            instance.calendarContainer.classList.add('custom-datepicker');
                            console.log('Datepicker inicializado en', input.id || 'campo sin id');
                        },
                        onChange: function(selectedDates, dateStr, instance) {
                            // Asegurarse de que el formato sea dd-mm-yyyy
                            if (selectedDates.length > 0) {
                                const date = selectedDates[0];
                                const day = String(date.getDate()).padStart(2, '0');
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const year = date.getFullYear();
                                
                                // Actualizar el valor del input manualmente
                                input.value = `${day}-${month}-${year}`;
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error al inicializar datepicker en', input.id || 'campo sin id', error);
                }
            } else {
                console.warn('Flatpickr no está disponible. Solo se aplicará el formateo manual.');
            }
        });
    } else {
        console.warn('No se encontraron campos de fecha para inicializar datepickers');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const requestTypes = document.querySelectorAll('.request-type');
    const subsectionTypes = document.querySelectorAll('.subsection-type');
    const breadcrumb = document.getElementById('breadcrumb');
    const prevStepButtons = document.querySelectorAll('.prev-step');
    
    // Inicializar datepickers
    initializeDatepickers();
    
    // Inicializar formateo de RUT
    initializeRutFormatting();

    // Función para inicializar el breadcrumb
    function initializeBreadcrumb() {
        const breadcrumbContainer = document.getElementById('breadcrumb');
        if (breadcrumbContainer) {
            breadcrumbContainer.innerHTML = '';
            
            const inicioItem = document.createElement('li');
            inicioItem.classList.add('breadcrumb-item', 'active');
            inicioItem.setAttribute('data-step', 'inicio');
            inicioItem.textContent = 'Inicio';
            inicioItem.addEventListener('click', () => {
                if (navigateToStepGlobal) {
                    navigateToStepGlobal('inicio');
                }
            });
            breadcrumbContainer.appendChild(inicioItem);
        }
    }

    // Inicializar el primer paso como activo
    const validacionInicialStep = document.getElementById('step-validacion-inicial');
    if (validacionInicialStep) {
        validacionInicialStep.classList.remove('hidden');
        validacionInicialStep.classList.add('active');
    }

    // Inicializar el breadcrumb
    initializeBreadcrumb();

    // Cargar países desde el archivo JSON
    function cargarPaises() {
        const rutaAbsoluta = window.location.origin + '/assets/paises.json';
        
        fetch(rutaAbsoluta, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            cache: 'no-cache'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const paisSelects = document.querySelectorAll('select[id$="-pais"], #exhibicion-pais, #pais, #pais-bancario');
            
            paisSelects.forEach(paisSelect => {
                if (!paisSelect) return;
                
                // Limpiar opciones existentes excepto la primera
                while (paisSelect.options.length > 1) {
                    paisSelect.remove(1);
                }
                
                // Agregar cada país como una opción
                data.forEach(pais => {
                    const option = document.createElement('option');
                    option.value = pais['Nombre del país'];
                    option.textContent = pais['Nombre del país'];
                    paisSelect.appendChild(option);
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar los países:', error);
        });
    }

    // Cargar países al iniciar la página
    cargarPaises();
 
   // Función para actualizar el breadcrumb
    function updateBreadcrumb(currentStep, addStep = true) {
        if (addStep) {
            const items = breadcrumb.querySelectorAll('.breadcrumb-item');
            items.forEach(item => {
                item.classList.remove('active');
            });
            
            const existingItem = breadcrumb.querySelector(`[data-step="${currentStep}"]`);
            
            if (existingItem) {
                existingItem.classList.add('active');
                
                let nextSibling = existingItem.nextElementSibling;
                while (nextSibling) {
                    const temp = nextSibling.nextElementSibling;
                    breadcrumb.removeChild(nextSibling);
                    nextSibling = temp;
                }
            } else {
                const newItem = document.createElement('li');
                newItem.classList.add('breadcrumb-item', 'active');
                newItem.setAttribute('data-step', currentStep);
                
                // Establecer el texto según el paso
                const stepNames = {
                    'inicio': 'Inicio',
                    'actualizacion': 'Actualización de información',
                    'datos-personales': 'Datos personales',
                    'datos-contacto': 'Datos de contacto',
                    'datos-bancarios': 'Datos bancarios',
                    'datos-autor': 'Datos de autor',
                    'ambito-clase': 'Ámbito o Clase',
                    'sociedades': 'Sociedades',
                    'exhibicion': 'Notificación de exhibición de obra en el extranjero',
                    'conflicto': 'Declaración de conflicto en obra',
                    'certificado': 'Solicitud de certificado',
                    'afiliacion': 'Certificado de Afiliación',
                    'obras-declaradas': 'Certificado de Obras Declaradas',
                    'otro-certificado': 'Otro Certificado',
                    'derechos-recibidos': 'Certificado de Derechos Recibidos',
                    'desafiliacion': 'Desafiliación',
                    'representante-legal': 'Representante Legal',
                    'otro': 'Otro'
                };
                
                newItem.textContent = stepNames[currentStep] || currentStep;
                
                breadcrumb.appendChild(newItem);
            }
            
            // Siempre agregar event listeners después de cualquier cambio
            addBreadcrumbListeners();
        } else {
            const items = breadcrumb.querySelectorAll('.breadcrumb-item');
            items.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-step') === currentStep) {
                    item.classList.add('active');
                }
            });
            
            // Asegurar que los event listeners estén presentes
            addBreadcrumbListeners();
        }
    }

    // Función para navegar a un paso específico
    function navigateToStep(step) {
        limpiarCamposFormulario();
        
        if (step === 'inicio') {
            const breadcrumbContainer = document.getElementById('breadcrumb');
            breadcrumbContainer.innerHTML = '';
            
            const inicioItem = document.createElement('li');
            inicioItem.classList.add('breadcrumb-item', 'active');
            inicioItem.setAttribute('data-step', 'inicio');
            inicioItem.textContent = 'Inicio';
            inicioItem.addEventListener('click', () => {
                if (navigateToStepGlobal) {
                    navigateToStepGlobal('inicio');
                }
            });
            breadcrumbContainer.appendChild(inicioItem);
        } else {
            updateBreadcrumb(step, false);
        }
        
        const currentActiveStep = document.querySelector('.carousel-step.active');
        if (currentActiveStep) {
            currentActiveStep.classList.add('slide-out');
            currentActiveStep.classList.remove('active');
            
            setTimeout(() => {
                currentActiveStep.classList.add('hidden');
                currentActiveStep.classList.remove('slide-out');
                
                const targetStep = document.getElementById(`step-${step}`);
                if (targetStep) {
                    targetStep.classList.remove('hidden');
                    setTimeout(() => {
                        targetStep.classList.add('active');
                        
                        // Mostrar formularios automáticamente para ciertas secciones
                        if (step === 'datos-personales') {
                            const updateOptions = document.getElementById('update-options');
                            if (updateOptions) {
                                updateOptions.classList.remove('hidden');
                            }
                        } else if (step === 'datos-contacto') {
                            const updateOptionsContacto = document.getElementById('update-options-contacto');
                            if (updateOptionsContacto) {
                                updateOptionsContacto.classList.remove('hidden');
                            }
                        } else if (step === 'datos-bancarios') {
                            const updateOptionsBancarios = document.getElementById('update-options-bancarios');
                            if (updateOptionsBancarios) {
                                updateOptionsBancarios.classList.remove('hidden');
                            }
                        } else if (step === 'ambito-clase') {
                            const ambitoClaseForm = document.getElementById('ambito-clase-form');
                            if (ambitoClaseForm) {
                                ambitoClaseForm.classList.remove('hidden');
                            }
                        } else if (step === 'sociedades') {
                            const sociedadesContainer = document.getElementById('sociedades-container');
                            if (sociedadesContainer) {
                                sociedadesContainer.classList.remove('hidden');
                            }
                        } else if (step === 'exhibicion') {
                            const exhibicionContainer = document.getElementById('exhibicion-container');
                            if (exhibicionContainer) {
                                exhibicionContainer.classList.remove('hidden');
                            }
                        } else if (step === 'conflicto') {
                            const conflictoForm = document.getElementById('conflicto-form');
                            if (conflictoForm) {
                                conflictoForm.classList.remove('hidden');
                            }
                        } else if (step === 'afiliacion') {
                            const afiliacionForm = document.getElementById('afiliacion-form');
                            if (afiliacionForm) {
                                afiliacionForm.classList.remove('hidden');
                            }
                        } else if (step === 'derechos-recibidos') {
                            const derechosForm = document.getElementById('derechos-form');
                            if (derechosForm) {
                                derechosForm.classList.remove('hidden');
                            }
                        } else if (step === 'obras-declaradas') {
                            const obrasDeclaradasForm = document.getElementById('obras-declaradas-form');
                            if (obrasDeclaradasForm) {
                                obrasDeclaradasForm.classList.remove('hidden');
                            }
                        } else if (step === 'otro-certificado') {
                            const otroCertificadoForm = document.getElementById('otro-certificado-form');
                            if (otroCertificadoForm) {
                                otroCertificadoForm.classList.remove('hidden');
                            }
                        } else if (step === 'desafiliacion') {
                            const desafiliacionForm = document.getElementById('desafiliacion-form');
                            if (desafiliacionForm) {
                                desafiliacionForm.classList.remove('hidden');
                            }
                        }
                    }, 50);
                }
            }, 500);
        } else {
            const targetStep = document.getElementById(`step-${step}`);
            if (targetStep) {
                targetStep.classList.remove('hidden');
                setTimeout(() => {
                    targetStep.classList.add('active');
                    
                    // Mostrar formularios automáticamente para ciertas secciones
                    if (step === 'datos-personales') {
                        const updateOptions = document.getElementById('update-options');
                        if (updateOptions) {
                            updateOptions.classList.remove('hidden');
                        }
                    } else if (step === 'datos-contacto') {
                        const updateOptionsContacto = document.getElementById('update-options-contacto');
                        if (updateOptionsContacto) {
                            updateOptionsContacto.classList.remove('hidden');
                        }
                    } else if (step === 'datos-bancarios') {
                        const updateOptionsBancarios = document.getElementById('update-options-bancarios');
                        if (updateOptionsBancarios) {
                            updateOptionsBancarios.classList.remove('hidden');
                        }
                    } else if (step === 'ambito-clase') {
                        const ambitoClaseForm = document.getElementById('ambito-clase-form');
                        if (ambitoClaseForm) {
                            ambitoClaseForm.classList.remove('hidden');
                        }
                    } else if (step === 'sociedades') {
                        const sociedadesContainer = document.getElementById('sociedades-container');
                        if (sociedadesContainer) {
                            sociedadesContainer.classList.remove('hidden');
                        }
                    } else if (step === 'exhibicion') {
                        const exhibicionContainer = document.getElementById('exhibicion-container');
                        if (exhibicionContainer) {
                            exhibicionContainer.classList.remove('hidden');
                        }
                    } else if (step === 'conflicto') {
                        const conflictoForm = document.getElementById('conflicto-form');
                        if (conflictoForm) {
                            conflictoForm.classList.remove('hidden');
                        }
                    } else if (step === 'afiliacion') {
                        const afiliacionForm = document.getElementById('afiliacion-form');
                        if (afiliacionForm) {
                            afiliacionForm.classList.remove('hidden');
                        }
                    } else if (step === 'derechos-recibidos') {
                        const derechosForm = document.getElementById('derechos-form');
                        if (derechosForm) {
                            derechosForm.classList.remove('hidden');
                        }
                    } else if (step === 'obras-declaradas') {
                        const obrasDeclaradasForm = document.getElementById('obras-declaradas-form');
                        if (obrasDeclaradasForm) {
                            obrasDeclaradasForm.classList.remove('hidden');
                        }
                    } else if (step === 'otro-certificado') {
                        const otroCertificadoForm = document.getElementById('otro-certificado-form');
                        if (otroCertificadoForm) {
                            otroCertificadoForm.classList.remove('hidden');
                        }
                    } else if (step === 'desafiliacion') {
                        const desafiliacionForm = document.getElementById('desafiliacion-form');
                        if (desafiliacionForm) {
                            desafiliacionForm.classList.remove('hidden');
                        }
                    }
                }, 50);
            }
        }
    }

    // Función para limpiar todos los campos del formulario
    function limpiarCamposFormulario() {
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.value = '';
        });
        
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
        
        // Restaurar valores por defecto para radio buttons de afiliación
        const ambitoNoAfiliacion = document.getElementById('ambito-no');
        const claseNoAfiliacion = document.getElementById('clase-no');
        if (ambitoNoAfiliacion) {
            ambitoNoAfiliacion.checked = true;
        }
        if (claseNoAfiliacion) {
            claseNoAfiliacion.checked = true;
        }
        
        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        document.querySelectorAll('.field-container:not(.hidden)').forEach(container => {
            container.classList.add('hidden');
        });
        
        const nombreObraField = document.getElementById('nombre-obra-field');
        if (nombreObraField) {
            nombreObraField.classList.add('hidden');
        }
        
        // Ocultar específicamente las opciones de clase en Ámbito o Clase
        const claseAudiovisualOptions = document.querySelectorAll('.clase-audiovisual');
        const claseDramaticoOptions = document.querySelectorAll('.clase-dramatico');
        
        claseAudiovisualOptions.forEach(option => {
            option.classList.add('hidden');
            option.classList.remove('show');
        });
        
        claseDramaticoOptions.forEach(option => {
            option.classList.add('hidden');
            option.classList.remove('show');
        });
        
        // Mostrar mensaje informativo de Ámbito o Clase si existe
        const noClaseMessage = document.getElementById('no-clase-message');
        if (noClaseMessage) {
            noClaseMessage.classList.remove('hidden');
        }
    }

    // Función para agregar event listeners al breadcrumb
    function addBreadcrumbListeners() {
        const breadcrumbItems = breadcrumb.querySelectorAll('.breadcrumb-item');
        breadcrumbItems.forEach(item => {
            // Remover listeners existentes clonando el elemento
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Agregar nuevo listener
            newItem.addEventListener('click', () => {
                const step = newItem.getAttribute('data-step');
                if (step && navigateToStepGlobal) {
                    // Eliminar todos los elementos posteriores al clickeado
                    let nextSibling = newItem.nextElementSibling;
                    while (nextSibling) {
                        const temp = nextSibling.nextElementSibling;
                        breadcrumb.removeChild(nextSibling);
                        nextSibling = temp;
                    }
                    
                    // Activar el elemento clickeado
                    breadcrumbItems.forEach(breadcrumbItem => breadcrumbItem.classList.remove('active'));
                    newItem.classList.add('active');
                    
                    navigateToStepGlobal(step);
                }
            });
        });
    }

    // Asignar funciones a variables globales para acceso desde enviarDatosAPowerAutomate
    navigateToStepGlobal = navigateToStep;

    // Event Listeners para los tipos de solicitud
    requestTypes.forEach(type => {
        type.addEventListener('click', function() {
            const requestType = this.getAttribute('data-type');
            
            if (requestType === 'actualizacion') {
                navigateToStep('actualizacion');
                updateBreadcrumb('actualizacion');
            } else if (requestType === 'exhibicion') {
                navigateToStep('exhibicion');
                updateBreadcrumb('exhibicion');
            } else if (requestType === 'conflicto') {
                navigateToStep('conflicto');
                updateBreadcrumb('conflicto');
            } else if (requestType === 'certificado') {
                navigateToStep('certificado');
                updateBreadcrumb('certificado');
            } else if (requestType === 'desafiliacion') {
                navigateToStep('desafiliacion');
                updateBreadcrumb('desafiliacion');
            } else if (requestType === 'otro') {
                navigateToStep('otro');
                updateBreadcrumb('otro');
            } else {
                alert('Esta funcionalidad estará disponible próximamente.');
            }
        });
    });

    // Event Listeners para las subsecciones
    subsectionTypes.forEach(subsection => {
        subsection.addEventListener('click', function() {
            const subsectionType = this.getAttribute('data-subsection');
            
            if (['datos-personales', 'datos-contacto', 'datos-bancarios', 'datos-autor'].includes(subsectionType)) {
                const items = breadcrumb.querySelectorAll('.breadcrumb-item');
                if (items.length > 2) {
                    for (let i = items.length - 1; i >= 2; i--) {
                        breadcrumb.removeChild(items[i]);
                    }
                }
                
                currentStep = subsectionType;
                navigateToStep(subsectionType);
                updateBreadcrumb(subsectionType);
            } else if (['ambito-clase', 'sociedades', 'afiliacion', 'derechos-recibidos', 'obras-declaradas', 'otro-certificado'].includes(subsectionType)) {
                // Para sociedades, limpiar breadcrumb y agregar datos-autor antes
                if (subsectionType === 'sociedades') {
                    const items = breadcrumb.querySelectorAll('.breadcrumb-item');
                    if (items.length > 2) {
                        for (let i = items.length - 1; i >= 2; i--) {
                            breadcrumb.removeChild(items[i]);
                        }
                    }
                    // Agregar datos-autor al breadcrumb antes de sociedades
                    updateBreadcrumb('datos-autor');
                }
                navigateToStep(subsectionType);
                updateBreadcrumb(subsectionType);
            } else if (subsectionType === 'representante-legal') {
                navigateToStep('representante-legal');
                updateBreadcrumb('representante-legal');
            } else {
                alert('Esta funcionalidad estará disponible próximamente.');
                navigateToStep('actualizacion');
                updateBreadcrumb('actualizacion');
            }
        });
    });

    // Event listeners para los botones de navegación
    prevStepButtons.forEach(button => {
        button.addEventListener('click', () => {
            const prevStep = button.getAttribute('data-prev');
            currentStep = prevStep;
            
            limpiarCamposFormulario();
            
            const items = breadcrumb.querySelectorAll('.breadcrumb-item');
            if (prevStep === 'actualizacion' && items.length > 2) {
                for (let i = items.length - 1; i >= 2; i--) {
                    breadcrumb.removeChild(items[i]);
                }
            }
            
            navigateToStep(prevStep);
            
            if (prevStep !== 'actualizacion') {
                updateBreadcrumb(prevStep, false);
            }
        });
    });  
  // Validadores de RUT para cada sección
    const rutValidators = [
        { buttonId: 'validate-rut-inicial', inputId: 'rut-inicial', errorId: 'rut-inicial-error', formId: 'step-inicio' },
        { buttonId: 'validate-rut', inputId: 'rut', errorId: 'rut-error', formId: 'update-options' },
        { buttonId: 'validate-rut-contacto', inputId: 'rut-contacto', errorId: 'rut-contacto-error', formId: 'update-options-contacto' },
        { buttonId: 'validate-rut-bancarios', inputId: 'rut-bancarios', errorId: 'rut-bancarios-error', formId: 'update-options-bancarios' },
        { buttonId: 'validate-rut-afiliacion', inputId: 'rut-afiliacion', errorId: 'rut-afiliacion-error', formId: 'afiliacion-form' },
        { buttonId: 'validate-rut-derechos', inputId: 'rut-derechos', errorId: 'rut-derechos-error', formId: 'derechos-form' },
        { buttonId: 'validate-rut-desafiliacion', inputId: 'rut-desafiliacion', errorId: 'rut-desafiliacion-error', formId: 'desafiliacion-form' },
        { buttonId: 'validate-rut-exhibicion', inputId: 'rut-exhibicion', errorId: 'rut-exhibicion-error', formId: 'exhibicion-container' },
        { buttonId: 'validate-rut-conflicto', inputId: 'rut-conflicto', errorId: 'rut-conflicto-error', formId: 'conflicto-form' }
    ];

    rutValidators.forEach(validator => {
        const button = document.getElementById(validator.buttonId);
        if (button) {
            button.addEventListener('click', function() {
                const rutInput = document.getElementById(validator.inputId);
                const rutError = document.getElementById(validator.errorId);
                const form = document.getElementById(validator.formId);
                
                if (!rutInput || !rutError) return;
                
                const rutValue = rutInput.value.trim();
                
                if (!rutValue) {
                    rutError.textContent = 'Por favor, ingresa un RUT de socio (autor) ';
                    return;
                }
                
                // Validación de tipo de usuario para todas las secciones
                const sectionMap = {
                    'validate-rut-inicial': 'tipo-usuario-inicial',
                    'validate-rut': 'tipo-usuario',
                    'validate-rut-contacto': 'tipo-usuario-contacto',
                    'validate-rut-bancarios': 'tipo-usuario-bancarios',
                    'validate-rut-sociedades': 'tipo-usuario-sociedades',
                    'validate-rut-exhibicion': 'tipo-usuario-exhibicion',
                    'validate-rut-conflicto': 'tipo-usuario-conflicto',
                    'validate-rut-afiliacion': 'tipo-usuario-afiliacion',
                    'validate-rut-derechos': 'tipo-usuario-derechos',
                    'validate-rut-desafiliacion': 'tipo-usuario-desafiliacion'
                };
                
                const tipoUsuarioName = sectionMap[validator.buttonId];
                if (tipoUsuarioName) {
                    const tipoUsuario = document.querySelector(`input[name="${tipoUsuarioName}"]:checked`);
                    if (!tipoUsuario) {
                        rutError.textContent = 'Por favor, selecciona si eres socio vigente o representante legal de un autor inscrito en ATN. ';
                        return;
                    }
                }
                
                // Validar correo electrónico
                const emailMap = {
                    'validate-rut': 'email-validacion',
                    'validate-rut-inicial': 'email-validacion-inicial',
                    'validate-rut-contacto': 'email-validacion-contacto',
                    'validate-rut-bancarios': 'email-validacion-bancarios',
                    'validate-rut-sociedades': 'email-validacion-sociedades',
                    'validate-rut-exhibicion': 'email-validacion-exhibicion',
                    'validate-rut-conflicto': 'email-validacion-conflicto',
                    'validate-rut-afiliacion': 'email-validacion-afiliacion',
                    'validate-rut-derechos': 'email-validacion-derechos',
                    'validate-rut-desafiliacion': 'email-validacion-desafiliacion'
                };
                
                const emailInputId = emailMap[validator.buttonId];
                if (emailInputId) {
                    const emailInput = document.getElementById(emailInputId);
                    const emailError = validator.buttonId === 'validate-rut-inicial' ? 
                        document.getElementById('email-inicial-error') : rutError;
                    
                    if (!emailInput || !emailInput.value.trim()) {
                        emailError.textContent = 'Ingresa tu correo electrónico ';
                        return;
                    }
                    if (!validarEmail(emailInput.value.trim())) {
                        emailError.textContent = 'Por favor, ingresa un correo electrónico válido';
                        return;
                    }
                    // Limpiar error de email si es válido
                    emailError.textContent = '';
                }
                
                if (!validarRut(rutValue)) {
                    rutError.textContent = 'RUT del autor inválido';
                } else {
                    rutError.textContent = '';
                    if (validator.buttonId === 'validate-rut-inicial') {
                        // Guardar datos de validación inicial
                        validacionInicialData.rut = rutValue;
                        const tipoUsuarioElement = document.querySelector('input[name="tipo-usuario-inicial"]:checked');
                        const emailElement = document.getElementById('email-validacion-inicial');
                        
                        if (tipoUsuarioElement) {
                            validacionInicialData.tipoUsuario = tipoUsuarioElement.value;
                        }
                        if (emailElement) {
                            validacionInicialData.emailValidacion = emailElement.value;
                        }
                        
                        // Para la validación inicial, mostrar modal informativo y luego ir al home
                        showInfoModal();
                        
                        // Modificar la navegación para que ocurra después de cerrar el modal
                        const originalHideModal = hideInfoModal;
                        window.hideInfoModal = function() {
                            originalHideModal();
                            navigateToStepGlobal('inicio');
                        };
                    } else if (form) {
                        form.classList.remove('hidden');
                    }
                }
            });
        }
    });

    // Handlers para checkboxes de actualización de datos
    const updateFieldsHandlers = [
        { checkboxName: 'update-fields', fields: ['nombre', 'seudonimo', 'genero'] },
        { checkboxName: 'update-fields-contacto', fields: ['direccion', 'email', 'telefono'] }
    ];

    updateFieldsHandlers.forEach(handler => {
        const checkboxes = document.querySelectorAll(`input[name="${handler.checkboxName}"]`);
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const fieldName = this.value;
                const fieldContainer = document.getElementById(`${fieldName}-field`);
                
                if (fieldContainer) {
                    if (this.checked) {
                        fieldContainer.classList.remove('hidden');
                        
                        // Si es el campo de dirección, configurar los event listeners
                        if (fieldName === 'direccion') {
                            setupAddressFieldListeners();
                        }
                    } else {
                        fieldContainer.classList.add('hidden');
                    }
                }
            });
        });
    });

    // Handler para tipo de afiliación
    const tipoAfiliacionRadios = document.querySelectorAll('input[name="tipo-afiliacion"]');
    tipoAfiliacionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const nombreObraContainer = document.getElementById('nombre-obra-container');
            if (nombreObraContainer) {
                if (this.value === 'con-obra') {
                    nombreObraContainer.classList.remove('hidden');
                } else {
                    nombreObraContainer.classList.add('hidden');
                }
            }
        });
    });

    // Handler para tipo de banco
    const tipoBancoSelect = document.getElementById('tipo-banco');
    if (tipoBancoSelect) {
        tipoBancoSelect.addEventListener('change', function() {
            handleBankTypeChange();
        });
    }

    // Handler para país bancario
    const paisBancarioSelect = document.getElementById('pais-bancario');
    if (paisBancarioSelect) {
        paisBancarioSelect.addEventListener('change', function() {
            handleBankTypeChange();
        });
    }

    function handleBankTypeChange() {
        const tipoBanco = document.getElementById('tipo-banco').value;
        const paisBancario = document.getElementById('pais-bancario').value;
        
        const tipoCuentaField = document.getElementById('tipo-cuenta-field');
        const paisField = document.getElementById('pais-field');
        const direccionBancoField = document.getElementById('direccion-banco-field');
        const swiftIbanField = document.getElementById('swift-iban-field');
        
        if (tipoBanco === 'nacional') {
            // Banco nacional: mostrar solo tipo de cuenta
            if (tipoCuentaField) tipoCuentaField.classList.remove('hidden');
            if (paisField) paisField.classList.add('hidden');
            if (direccionBancoField) direccionBancoField.classList.add('hidden');
            if (swiftIbanField) swiftIbanField.classList.add('hidden');
        } else if (tipoBanco === 'extranjero') {
            // Mostrar campo país siempre para bancos extranjeros
            if (paisField) paisField.classList.remove('hidden');
            
            // Solo cargar países si el select está vacío (evitar limpiar selección)
            const paisSelect = document.getElementById('pais-bancario');
            if (paisSelect && paisSelect.options.length <= 1) {
                cargarPaises();
            }
            
            if (paisBancario === 'Chile') {
                // Extranjero + Chile: mostrar solo tipo de cuenta (como nacional)
                if (tipoCuentaField) tipoCuentaField.classList.remove('hidden');
                if (direccionBancoField) direccionBancoField.classList.add('hidden');
                if (swiftIbanField) swiftIbanField.classList.add('hidden');
            } else if (paisBancario && paisBancario !== 'Chile') {
                // Extranjero + otro país: mostrar dirección banco y swift/iban
                if (tipoCuentaField) tipoCuentaField.classList.add('hidden');
                if (direccionBancoField) direccionBancoField.classList.remove('hidden');
                if (swiftIbanField) swiftIbanField.classList.remove('hidden');
            } else {
                // Extranjero sin país seleccionado: ocultar campos condicionales
                if (tipoCuentaField) tipoCuentaField.classList.add('hidden');
                if (direccionBancoField) direccionBancoField.classList.add('hidden');
                if (swiftIbanField) swiftIbanField.classList.add('hidden');
            }
        } else {
            // Sin tipo de banco seleccionado: ocultar todos los campos condicionales
            if (tipoCuentaField) tipoCuentaField.classList.add('hidden');
            if (paisField) paisField.classList.add('hidden');
            if (direccionBancoField) direccionBancoField.classList.add('hidden');
            if (swiftIbanField) swiftIbanField.classList.add('hidden');
        }
    }

    // Funciones para la gestión de exhibiciones
    function validarFormatoFecha(fecha) {
        const regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/;
        return regex.test(fecha);
    }

    function renderizarTablaExhibiciones() {
        const exhibicionesBody = document.getElementById('exhibiciones-body');
        if (!exhibicionesBody) return;
        
        // Debug: Mostrar datos antes de renderizar
        console.log('Renderizando tabla con datos:', exhibicionesData);
        
        exhibicionesBody.innerHTML = '';
        
        if (exhibicionesData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" style="text-align: center;">No hay exhibiciones extranjeras ingresadas en esta solicitud. </td>`;
            exhibicionesBody.appendChild(row);
            return;
        }
        
        exhibicionesData.forEach((exhibicion, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${exhibicion.ambito}</td>
                <td>${exhibicion.obra}</td>
                <td>${exhibicion.tituloTraducido || '-'}</td>
                <td>${exhibicion.pais}</td>
                <td>${exhibicion.canal || '-'}</td>
                <td>${exhibicion.fecha}</td>
                <td>${exhibicion.fechaTermino || '-'}</td>
                <td class="action-buttons">
                    <button type="button" class="action-button edit-button" data-index="${index}">Editar</button>
                    <button type="button" class="action-button delete-button" data-index="${index}">Eliminar</button>
                </td>
            `;
            exhibicionesBody.appendChild(row);
        });
        
        // Agregar event listeners a los botones de acción
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editarExhibicion(index);
            });
        });
        
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                eliminarExhibicion(index);
            });
        });
    }

    function mostrarFormularioExhibicion() {
        const exhibicionForm = document.getElementById('exhibicion-form');
        if (exhibicionForm) {
            exhibicionForm.classList.remove('hidden');
            document.getElementById('exhibicion-ambito').value = '';
            document.getElementById('exhibicion-obra').value = '';
            document.getElementById('exhibicion-titulo-traducido').value = '';
            document.getElementById('exhibicion-pais').value = '';
            document.getElementById('exhibicion-canal').value = '';
            document.getElementById('exhibicion-fecha').value = '';
            document.getElementById('exhibicion-fecha-termino').value = '';
            editingIndex = -1;
        }
    }

    function ocultarFormularioExhibicion() {
        const exhibicionForm = document.getElementById('exhibicion-form');
        if (exhibicionForm) {
            exhibicionForm.classList.add('hidden');
        }
    }

    function guardarExhibicion() {
        console.log('=== INICIO GUARDAR EXHIBICION ===');
        
        const ambito = document.getElementById('exhibicion-ambito').value;
        const obra = document.getElementById('exhibicion-obra').value;
        const tituloTraducido = document.getElementById('exhibicion-titulo-traducido').value;
        const pais = document.getElementById('exhibicion-pais').value;
        const canal = document.getElementById('exhibicion-canal').value;
        const fecha = document.getElementById('exhibicion-fecha').value;
        const fechaTermino = document.getElementById('exhibicion-fecha-termino').value;
        
        // Debug: Verificar que los elementos existen
        console.log('Elementos del DOM:', {
            'exhibicion-ambito': document.getElementById('exhibicion-ambito'),
            'exhibicion-obra': document.getElementById('exhibicion-obra'),
            'exhibicion-titulo-traducido': document.getElementById('exhibicion-titulo-traducido'),
            'exhibicion-pais': document.getElementById('exhibicion-pais'),
            'exhibicion-canal': document.getElementById('exhibicion-canal'),
            'exhibicion-fecha': document.getElementById('exhibicion-fecha'),
            'exhibicion-fecha-termino': document.getElementById('exhibicion-fecha-termino')
        });
        
        // Debug: Mostrar valores obtenidos
        console.log('Valores del formulario:', {
            ambito, obra, tituloTraducido, pais, canal, fecha, fechaTermino
        });
        
        // Validar campos obligatorios: Ámbito, Obra, País, Canal/Plataforma/Sala, Fecha
        if (!ambito || !obra || !pais || !canal || !fecha) {
            alert('Por favor, completa todos los campos obligatorios: Ámbito, Obra, País, Canal/Plataforma/Sala y Fecha estimada');
            return;
        }
        
        if (!validarFormatoFecha(fecha)) {
            alert('Por favor, ingresa la fecha en formato dd-mm-yyyy');
            return;
        }
        
        // Validar fecha de término si se proporciona
        if (fechaTermino && !validarFormatoFecha(fechaTermino)) {
            alert('Por favor, ingresa la fecha estimada de término en formato dd-mm-yyyy');
            return;
        }
        
        // Validar que la fecha de término no sea anterior a la fecha de inicio
        if (fechaTermino && validarFormatoFecha(fechaTermino) && validarFormatoFecha(fecha)) {
            const fechaInicio = convertirFechaADate(fecha);
            const fechaFin = convertirFechaADate(fechaTermino);
            
            if (fechaFin < fechaInicio) {
                alert('La fecha de término no puede ser anterior a la fecha de inicio de la exhibición');
                return;
            }
        }
        
        const exhibicion = { 
            ambito, 
            obra, 
            tituloTraducido: tituloTraducido || '', // Campo opcional
            pais, 
            canal, 
            fecha,
            fechaTermino: fechaTermino || '' // Campo opcional
        };
        
        // Debug: Mostrar objeto exhibición creado
        console.log('Objeto exhibición creado:', exhibicion);
        
        if (editingIndex === -1) {
            exhibicionesData.push(exhibicion);
            console.log('Exhibición agregada. Array completo:', exhibicionesData);
        } else {
            exhibicionesData[editingIndex] = exhibicion;
            console.log('Exhibición editada. Array completo:', exhibicionesData);
        }
        
        renderizarTablaExhibiciones();
        ocultarFormularioExhibicion();
    }

    function editarExhibicion(index) {
        const exhibicion = exhibicionesData[index];
        
        document.getElementById('exhibicion-ambito').value = exhibicion.ambito;
        document.getElementById('exhibicion-obra').value = exhibicion.obra;
        document.getElementById('exhibicion-titulo-traducido').value = exhibicion.tituloTraducido || '';
        document.getElementById('exhibicion-pais').value = exhibicion.pais;
        document.getElementById('exhibicion-canal').value = exhibicion.canal || '';
        document.getElementById('exhibicion-fecha').value = exhibicion.fecha;
        document.getElementById('exhibicion-fecha-termino').value = exhibicion.fechaTermino || '';
        
        editingIndex = index;
        const exhibicionForm = document.getElementById('exhibicion-form');
        if (exhibicionForm) {
            exhibicionForm.classList.remove('hidden');
        }
    }

    function eliminarExhibicion(index) {
        if (confirm('¿Está seguro de que desea eliminar esta exhibición?')) {
            exhibicionesData.splice(index, 1);
            renderizarTablaExhibiciones();
        }
    }  


    // Función para determinar el tipo de solicitud y enviar datos
    function enviarDatos(formData) {
        let tipoSolicitud = 'actualizacion-datos-personales';
        
        if (formData.campos) {
            if (formData.campos.hasOwnProperty('direccion') || formData.campos.hasOwnProperty('email') || formData.campos.hasOwnProperty('telefono')) {
                tipoSolicitud = 'actualizacion-datos-contacto';
            } else if (formData.campos.hasOwnProperty('tipo-banco')) {
                tipoSolicitud = 'actualizacion-datos-bancarios';
            }
        }
        
        // Validar que los campos requeridos no estén vacíos
        if (!formData.rut || formData.rut.trim() === '') {
            alert('Error: No se pudo obtener el RUT del autor de validación. Por favor, recargue la página e intente nuevamente.');
            return;
        }
        
        if (!formData.tipoUsuario || formData.tipoUsuario.trim() === '') {
            alert('Error: No se pudo obtener el tipo de usuario. Por favor, recargue la página e intente nuevamente.');
            return;
        }
        
        if (!formData.emailValidacion || formData.emailValidacion.trim() === '') {
            alert('Error: No se pudo obtener el email de validación. Por favor, recargue la página e intente nuevamente.');
            return;
        }
        
        enviarDatosAPowerAutomate(formData, tipoSolicitud);
    }

    // Función para resetear el breadcrumb al inicio
    function resetBreadcrumbToStart() {
        const breadcrumbContainer = document.getElementById('breadcrumb');
        if (breadcrumbContainer) {
            breadcrumbContainer.innerHTML = '';
            
            const inicioItem = document.createElement('li');
            inicioItem.classList.add('breadcrumb-item', 'active');
            inicioItem.setAttribute('data-step', 'inicio');
            inicioItem.textContent = 'Inicio';
            breadcrumbContainer.appendChild(inicioItem);
            
            addBreadcrumbListeners();
        }
    }

    // Función para resetear el formulario
    function resetForm() {
        // Limpiar todos los campos de entrada EXCEPTO el formulario "Otro" y "Otro Certificado"
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea').forEach(input => {
            // No limpiar los campos del formulario "Otro" ni "Otro Certificado"
            if (input.id !== 'detalleSolicitud' && 
                input.id !== 'detalles-certificado-otro' && 
                input.id !== 'otro-certificado-motivo') {
                input.value = '';
            }
        });
        
        // Desmarcar todos los checkboxes y radio buttons
        document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
            input.checked = false;
        });
        
        // Restaurar valores por defecto para radio buttons de afiliación
        const ambitoNoAfiliacion = document.getElementById('ambito-no');
        const claseNoAfiliacion = document.getElementById('clase-no');
        if (ambitoNoAfiliacion) ambitoNoAfiliacion.checked = true;
        if (claseNoAfiliacion) claseNoAfiliacion.checked = true;
        
        // Resetear todos los selects a su primera opción
        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        // Resetear arrays de datos globales
        exhibicionesData = [];
        sociedadesData = [];
        editingIndex = -1;
        editingSociedadIndex = -1;
        
        // NO resetear datos de validación inicial para permitir múltiples envíos
        // Los datos de validación inicial se mantienen durante toda la sesión
        // validacionInicialData = {
        //     rut: '',
        //     tipoUsuario: '',
        //     emailValidacion: ''
        // };
        
        // Resetear step actual
        currentStep = 'validacion-inicial';
        
        // Renderizar tablas vacías
        if (typeof renderizarTablaExhibiciones === 'function') {
            renderizarTablaExhibiciones();
        }
        if (typeof renderizarTablaSociedades === 'function') {
            renderizarTablaSociedades();
        }
        
        // Ocultar todos los contenedores de formularios EXCEPTO el del formulario "Otro"
        document.querySelectorAll('.form-container, #update-options, #update-options-contacto, #update-options-bancarios').forEach(container => {
            // No ocultar el contenedor del formulario "Otro"
            if (!container.closest('#step-otro')) {
                container.classList.add('hidden');
            }
        });
        
        // Ocultar todos los campos específicos
        document.querySelectorAll('.field-container').forEach(field => {
            field.classList.add('hidden');
        });
        
        // Ocultar formularios específicos de secciones
        document.querySelectorAll('#ambito-clase-form, #sociedades-container, #exhibicion-container').forEach(container => {
            container.classList.add('hidden');
        });
        
        // Ocultar formularios modales/emergentes
        document.querySelectorAll('#sociedad-form, #exhibicion-form').forEach(form => {
            form.classList.add('hidden');
        });
        
        // Limpiar mensajes de error
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
        
        // Resetear el breadcrumb al inicio
        resetBreadcrumbToStart();
    }

    // Asignar función resetForm a variable global
    resetFormGlobal = resetForm;

    // Handlers de envío para todos los formularios
    
    // Datos personales
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            const selectedFields = document.querySelectorAll('input[name="update-fields"]:checked');
            
            if (selectedFields.length === 0) {
                alert('Por favor, selecciona al menos un campo para actualizar. ');
                return;
            }
            
            // Verificar si "Nombre" está seleccionado
            const nombreSelected = document.getElementById('update-nombre').checked;
            
            // Validar campo "Detalle de la solicitud" solo si "Nombre" está seleccionado
            if (nombreSelected) {
                const observacionesField = document.getElementById('observaciones');
                if (!observacionesField.value.trim()) {
                    alert('Por favor, completa el campo "Detalle de la solicitud" cuando selecciones actualizar el nombre.');
                    observacionesField.focus();
                    return;
                }
            }
            
            let isValid = true;
            
            let formData = {
                rut: validacionInicialData.rut || '',
                tipoUsuario: validacionInicialData.tipoUsuario || '',
                emailValidacion: validacionInicialData.emailValidacion || '',
                campos: {},
                observaciones: document.getElementById('observaciones') ? document.getElementById('observaciones').value : ''
            };
            
            selectedFields.forEach(field => {
                const fieldName = field.value;
                const fieldValue = document.getElementById(fieldName).value;
                
                if (!fieldValue) {
                    isValid = false;
                    let fieldDisplayName;
                    switch(fieldName) {
                        case 'nombre':
                            fieldDisplayName = 'Nombre completo';
                            break;
                        case 'seudonimo':
                            fieldDisplayName = 'Seudónimo';
                            break;
                        case 'genero':
                            fieldDisplayName = 'Género';
                            break;
                        default:
                            fieldDisplayName = fieldName;
                    }
                    alert(`Por favor, completa el campo ${fieldDisplayName}.`);
                    return;
                }
                
                formData.campos[fieldName] = fieldValue;
            });
            
            if (!isValid) return;
            
            enviarDatos(formData);
        });
    }

    // Datos de contacto
    const submitButtonContacto = document.getElementById('submit-button-contacto');
    if (submitButtonContacto) {
        submitButtonContacto.addEventListener('click', function() {
            const selectedFields = document.querySelectorAll('input[name="update-fields-contacto"]:checked');
            
            if (selectedFields.length === 0) {
                alert('Por favor, selecciona al menos un campo para actualizar. ');
                return;
            }
            
            let isValid = true;
            let formData = {
                rut: validacionInicialData.rut || '',
                tipoUsuario: validacionInicialData.tipoUsuario || '',
                emailValidacion: validacionInicialData.emailValidacion || '',
                campos: {},
                observaciones: document.getElementById('observaciones-contacto') ? document.getElementById('observaciones-contacto').value : ''
            };
            
            selectedFields.forEach(field => {
                const fieldName = field.value;
                
                // Validación especial para el campo dirección
                if (fieldName === 'direccion') {
                    // Validar campos obligatorios de dirección
                    const paisSelect = document.getElementById('pais');
                    const direccionInput = document.getElementById('direccion');
                    
                    if (!paisSelect || !paisSelect.value) {
                        isValid = false;
                        alert('Por favor, selecciona un país.');
                        return;
                    }
                    
                    if (!direccionInput || !direccionInput.value.trim()) {
                        isValid = false;
                        alert('Por favor, completa la información de tu dirección actualizada. ');
                        return;
                    }
                    
                    // Validaciones específicas según el país
                    if (paisSelect.value === 'Chile') {
                        const regionSelect = document.getElementById('region');
                        const comunaSelect = document.getElementById('comuna');
                        
                        if (!regionSelect || !regionSelect.value) {
                            isValid = false;
                            alert('Por favor, selecciona una región.');
                            return;
                        }
                        
                        if (!comunaSelect || !comunaSelect.value) {
                            isValid = false;
                            alert('Por favor, selecciona una comuna.');
                            return;
                        }
                        
                        // Agregar datos de Chile al formData
                        formData.campos.pais = paisSelect.value;
                        formData.campos.region = regionSelect.value;
                        formData.campos.comuna = comunaSelect.value;
                    } else {
                        // Validar campos para otros países
                        const estadoInput = document.getElementById('estado');
                        const distritoInput = document.getElementById('distrito');
                        
                        if (!estadoInput || !estadoInput.value.trim()) {
                            isValid = false;
                            alert('Por favor, completa el campo Estado.');
                            return;
                        }
                        
                        if (!distritoInput || !distritoInput.value.trim()) {
                            isValid = false;
                            alert('Por favor, completa el campo Distrito.');
                            return;
                        }
                        
                        // Agregar datos de otros países al formData
                        formData.campos.pais = paisSelect.value;
                        formData.campos.estado = estadoInput.value.trim();
                        formData.campos.distrito = distritoInput.value.trim();
                    }
                    
                    // Agregar dirección y campo opcional
                    formData.campos.direccion = direccionInput.value.trim();
                    
                    const deptoCasaOficinaInput = document.getElementById('depto-casa-oficina');
                    if (deptoCasaOficinaInput && deptoCasaOficinaInput.value.trim()) {
                        formData.campos.deptoCasaOficina = deptoCasaOficinaInput.value.trim();
                    }
                    
                } else {
                    // Validación para otros campos (email, teléfono)
                    const fieldValue = document.getElementById(fieldName).value;
                    
                    if (!fieldValue) {
                        isValid = false;
                        
                        // Mensajes personalizados según el campo
                        let displayName = fieldName;
                        switch(fieldName) {
                            case 'email':
                                displayName = 'Email';
                                break;
                            case 'telefono':
                                displayName = 'Teléfono';
                                break;
                        }
                        
                        alert(`Por favor, completa el campo ${displayName}.`);
                        return;
                    }
                    
                    if (fieldName === 'email' && !validarEmail(fieldValue)) {
                        isValid = false;
                        alert('Por favor, ingresa un correo electrónico válido.');
                        return;
                    }
                    
                    formData.campos[fieldName] = fieldValue;
                }
            });
            
            if (!isValid) return;
            
            enviarDatos(formData);
        });
    }

    // Datos bancarios
    const submitButtonBancarios = document.getElementById('submit-button-bancarios');
    if (submitButtonBancarios) {
        submitButtonBancarios.addEventListener('click', function() {
            const tipoBanco = document.getElementById('tipo-banco').value;
            const banco = document.getElementById('banco').value;
            const numeroCuenta = document.getElementById('numero-cuenta').value;
            
            // Validaciones específicas para campos básicos obligatorios
            if (!tipoBanco) {
                alert('Por favor, selecciona el tipo de banco.');
                return;
            }
            
            if (!banco) {
                alert('Por favor, ingresa el nombre del banco.');
                return;
            }
            
            if (!numeroCuenta) {
                alert('Por favor, ingresa el número de cuenta.');
                return;
            }
            
            let isValid = true;
            let formData = {
                rut: validacionInicialData.rut || '',
                tipoUsuario: validacionInicialData.tipoUsuario || '',
                emailValidacion: validacionInicialData.emailValidacion || '',
                campos: {
                    'tipo-banco': tipoBanco,
                    'banco': banco,
                    'numero-cuenta': numeroCuenta
                },
                observaciones: document.getElementById('observaciones-bancarios') ? document.getElementById('observaciones-bancarios').value : ''
            };
            
            if (tipoBanco === 'nacional') {
                const tipoCuenta = document.getElementById('tipo-cuenta').value;
                if (!tipoCuenta) {
                    alert('Por favor, selecciona el tipo de cuenta.');
                    return;
                }
                formData.campos['tipo-cuenta'] = tipoCuenta;
            } else if (tipoBanco === 'extranjero') {
                const pais = document.getElementById('pais-bancario').value;
                const direccionBanco = document.getElementById('direccion-banco').value;
                const swiftIban = document.getElementById('swift-iban').value;
                
                // Validaciones específicas para banco extranjero
                if (!pais) {
                    alert('Por favor, selecciona el país del banco.');
                    return;
                }
                
                // Si el país es Chile, validar como banco nacional
                if (pais === 'Chile') {
                    const tipoCuenta = document.getElementById('tipo-cuenta').value;
                    if (!tipoCuenta) {
                        alert('Por favor, selecciona el tipo de cuenta.');
                        return;
                    }
                    formData.campos['tipo-cuenta'] = tipoCuenta;
                } else {
                    // Para países que NO son Chile, validar Swift/IBAN (dirección del banco es opcional)
                    if (!swiftIban) {
                        alert('Por favor, ingresa el código Swift o IBAN.');
                        return;
                    }
                    formData.campos['direccion-banco'] = direccionBanco; // Opcional, se incluye si tiene valor
                    formData.campos['swift-iban'] = swiftIban;
                }
                
                formData.campos['pais'] = pais;
            }
            
            if (!isValid) return;
            
            enviarDatos(formData);
        });
    }



    // Conflicto en obra
    const submitButtonConflicto = document.getElementById('submit-button-conflicto');
    if (submitButtonConflicto) {
        submitButtonConflicto.addEventListener('click', function() {
            const obraInput = document.getElementById('conflicto-obra');
            const descripcionInput = document.getElementById('conflicto-descripcion');
            const ambitoRadio = document.querySelector('input[name="conflicto-ambito"]:checked');
            
            // Usar el RUT almacenado en validacionInicialData en lugar del campo HTML
            if (!validacionInicialData.rut || !validacionInicialData.rut.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            if (!obraInput || !obraInput.value.trim()) {
                alert('Por favor, ingresa el nombre de la obra en conflicto.');
                return;
            }
            
            if (!descripcionInput || !descripcionInput.value.trim()) {
                alert('Por favor, describa el conflicto.');
                return;
            }
            
            if (!ambitoRadio) {
                alert('Por favor, seleccione un ámbito.');
                return;
            }
            
            const datos = {
                rut: validacionInicialData.rut,
                tipoUsuario: validacionInicialData.tipoUsuario,
                emailValidacion: validacionInicialData.emailValidacion,
                ambito: ambitoRadio.value,
                obra: obraInput.value.trim(),
                descripcion: descripcionInput.value.trim()
            };
            
            enviarDatosAPowerAutomate(datos, 'conflicto-obra');
        });
    }

    // Certificado de afiliación
    const submitButtonAfiliacion = document.getElementById('submit-button-afiliacion');
    if (submitButtonAfiliacion) {
        submitButtonAfiliacion.addEventListener('click', function() {
            const motivoInput = document.getElementById('afiliacion-motivo');
            const ambitoAfiliacion = document.querySelector('input[name="ambito-afiliacion"]:checked');
            const claseAfiliacion = document.querySelector('input[name="clase-afiliacion"]:checked');
            
            if (!ambitoAfiliacion) {
                alert('Por favor, seleccione una opción para Ámbito.');
                return;
            }
            
            if (!claseAfiliacion) {
                alert('Por favor, seleccione una opción para Clase.');
                return;
            }
            
            const datos = {
                ambitoAfiliacion: ambitoAfiliacion.value,
                claseAfiliacion: claseAfiliacion.value,
                motivo: motivoInput.value.trim()
            };
            
            enviarDatosAPowerAutomate(datos, 'certificado-afiliacion');
        });
    }

    // Certificado de derechos recibidos
    const submitButtonDerechos = document.getElementById('submit-button-derechos');
    if (submitButtonDerechos) {
        submitButtonDerechos.addEventListener('click', function() {
            const fechaInicioInput = document.getElementById('derechos-fecha-inicio');
            const fechaFinInput = document.getElementById('derechos-fecha-fin');
            
            if (!fechaInicioInput || !fechaInicioInput.value.trim()) {
                alert('Por favor, ingresa la fecha de inicio.');
                return;
            }
            
            if (!fechaFinInput || !fechaFinInput.value.trim()) {
                alert('Por favor, ingresa la fecha de fin.');
                return;
            }
            
            const datos = {
                fechaInicio: fechaInicioInput.value.trim(),
                fechaFin: fechaFinInput.value.trim()
            };
            
            enviarDatosAPowerAutomate(datos, 'certificado-derechos-recibidos');
        });
    }

    // Desafiliación
    const submitButtonDesafiliacion = document.getElementById('submit-button-desafiliacion');
    if (submitButtonDesafiliacion) {
        submitButtonDesafiliacion.addEventListener('click', function() {
            const motivoInput = document.getElementById('desafiliacion-motivo');
            
            // Validar que el campo motivo no esté vacío
            if (!motivoInput.value.trim()) {
                alert('Por favor, ingresa el motivo de la solicitud de desafiliación.');
                motivoInput.focus();
                return;
            }
            
            const datos = {
                motivo: motivoInput.value.trim()
            };
            
            enviarDatosAPowerAutomate(datos, 'desafiliacion');
        });
    }

    // Certificado de obras declaradas
    const submitButtonObrasDeclaradas = document.getElementById('submit-button-obras-declaradas');
    if (submitButtonObrasDeclaradas) {
        submitButtonObrasDeclaradas.addEventListener('click', function() {
            const motivoInput = document.getElementById('obras-declaradas-motivo');
            
            // Validar que al menos un ámbito esté seleccionado
            const ambitosSeleccionados = document.querySelectorAll('input[name="ambito-obras"]:checked');
            if (ambitosSeleccionados.length === 0) {
                alert('Por favor, seleccione al menos un ámbito (Audiovisual o Dramático).');
                return;
            }
            
            // Validar que se haya seleccionado una opción para incluir rol
            const incluirRol = document.querySelector('input[name="incluir-rol-obras"]:checked');
            if (!incluirRol) {
                alert('Por favor, seleccione si desea incluir el rol declarado para cada obra.');
                return;
            }
            
            // Validar que se haya seleccionado una opción para incluir porcentaje
            const incluirPorcentaje = document.querySelector('input[name="incluir-porcentaje-obras"]:checked');
            if (!incluirPorcentaje) {
                alert('Por favor, seleccione si desea incluir el porcentaje de participación.');
                return;
            }
            
            // Validar que el campo motivo esté completo
            if (!motivoInput || !motivoInput.value.trim()) {
                alert('Por favor, completa el campo de motivo de la solicitud.');
                return;
            }
            
            // Recopilar los ámbitos seleccionados
            const ambitosArray = Array.from(ambitosSeleccionados).map(checkbox => checkbox.value);
            
            const datos = {
                ambitosObras: ambitosArray,
                incluirRolObras: incluirRol.value,
                incluirPorcentajeObras: incluirPorcentaje.value,
                motivo: motivoInput.value.trim()
            };
            
            enviarDatosAPowerAutomate(datos, 'certificado-obras-declaradas');
        });
    }

    // Otro certificado
    const submitButtonOtroCertificado = document.getElementById('submit-button-otro-certificado');
    if (submitButtonOtroCertificado) {
        submitButtonOtroCertificado.addEventListener('click', function() {
            const detallesCertificadoInput = document.getElementById('detalles-certificado-otro');
            const motivoInput = document.getElementById('otro-certificado-motivo');
            
            // Validar que ambos campos estén completos
            if (!detallesCertificadoInput || !detallesCertificadoInput.value.trim()) {
                alert('Por favor, ingresa los detalles del certificado solicitado.');
                return;
            }
            
            if (!motivoInput || !motivoInput.value.trim()) {
                alert('Por favor, ingresa el motivo de la solicitud.');
                return;
            }
            
            const datos = {
                detallesCertificadoOtro: detallesCertificadoInput.value.trim(),
                motivo: motivoInput.value.trim()
            };
            
            enviarDatosAPowerAutomate(datos, 'otro-certificado');
        });
    }

// Funcionalidad específica para Ámbito o Clase
function initAmbitoClaseSection() {
        const ambitoAudiovisual = document.getElementById('ambito-audiovisual');
        const ambitoDramatico = document.getElementById('ambito-dramatico');
        const claseAudiovisualOptions = document.querySelectorAll('.clase-audiovisual');
        const claseDramaticoOptions = document.querySelectorAll('.clase-dramatico');
        const noClaseMessage = document.getElementById('no-clase-message');
        const observacionesInput = document.getElementById('observaciones-ambito');

        // Función para limpiar el formulario al inicializar
        function resetAmbitoClaseForm() {
            // Desmarcar todos los checkboxes de ámbito
            if (ambitoAudiovisual) ambitoAudiovisual.checked = false;
            if (ambitoDramatico) ambitoDramatico.checked = false;
            
            // Desmarcar todos los checkboxes de clase y ocultarlos
            const allClaseCheckboxes = document.querySelectorAll('input[name="clase"]');
            allClaseCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Ocultar todas las opciones de clase
            claseAudiovisualOptions.forEach(option => {
                option.classList.add('hidden');
                option.classList.remove('show');
            });
            
            claseDramaticoOptions.forEach(option => {
                option.classList.add('hidden');
                option.classList.remove('show');
            });
            
            // Limpiar observaciones
            if (observacionesInput) {
                observacionesInput.value = '';
            }
            
            // Mostrar mensaje informativo
            if (noClaseMessage) {
                noClaseMessage.classList.remove('hidden');
            }
        }

        // Limpiar formulario al inicializar
        resetAmbitoClaseForm();

        // Función para mostrar/ocultar opciones de clase según el ámbito seleccionado
        function toggleClaseOptions() {
            let hasAnyAmbitoSelected = false;

            // Mostrar/ocultar opciones de Audiovisual
            if (ambitoAudiovisual && ambitoAudiovisual.checked) {
                hasAnyAmbitoSelected = true;
                claseAudiovisualOptions.forEach((option, index) => {
                    setTimeout(() => {
                        option.classList.remove('hidden');
                        option.classList.add('show');
                    }, index * 100);
                });
            } else {
                claseAudiovisualOptions.forEach(option => {
                    option.classList.add('hidden');
                    option.classList.remove('show');
                    // Desmarcar checkboxes cuando se ocultan
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    if (checkbox) checkbox.checked = false;
                });
            }

            // Mostrar/ocultar opciones de Dramático
            if (ambitoDramatico && ambitoDramatico.checked) {
                hasAnyAmbitoSelected = true;
                claseDramaticoOptions.forEach((option, index) => {
                    setTimeout(() => {
                        option.classList.remove('hidden');
                        option.classList.add('show');
                    }, index * 100);
                });
            } else {
                claseDramaticoOptions.forEach(option => {
                    option.classList.add('hidden');
                    option.classList.remove('show');
                    // Desmarcar checkboxes cuando se ocultan
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    if (checkbox) checkbox.checked = false;
                });
            }

            // Mostrar/ocultar mensaje informativo
            if (noClaseMessage) {
                if (hasAnyAmbitoSelected) {
                    noClaseMessage.classList.add('hidden');
                } else {
                    noClaseMessage.classList.remove('hidden');
                }
            }
        }

        // Agregar event listeners a los checkboxes de ámbito
        if (ambitoAudiovisual) {
            ambitoAudiovisual.addEventListener('change', toggleClaseOptions);
        }

        if (ambitoDramatico) {
            ambitoDramatico.addEventListener('change', toggleClaseOptions);
        }

        // Inicializar el estado
        toggleClaseOptions();
    }

    // Inicializar funcionalidad de ámbito y clase directamente
    initAmbitoClaseSection();

    // Handler de envío para ámbito y clase
    const submitButtonAmbito = document.getElementById('submit-button-ambito');
    if (submitButtonAmbito) {
        submitButtonAmbito.addEventListener('click', function() {
            const ambitoCheckboxes = document.querySelectorAll('input[name="ambito"]:checked');
            const claseCheckboxes = document.querySelectorAll('input[name="clase"]:checked');
            const observacionesInput = document.getElementById('observaciones-ambito');
            
            if (ambitoCheckboxes.length === 0) {
                alert('Por favor, seleccione al menos un ámbito.');
                return;
            }
            
            if (claseCheckboxes.length === 0) {
                alert('Por favor, seleccione al menos una clase.');
                return;
            }
            
            // Validar que el campo detalleSolicitud sea obligatorio
            if (!observacionesInput || observacionesInput.value.trim() === '') {
                alert('Por favor, completa el campo "Detalles de la solicitud".');
                return;
            }
            
            // Validación especial: si se marcan ambos ámbitos, debe haber al menos una clase de cada uno
            const ambitos = Array.from(ambitoCheckboxes).map(cb => cb.value);
            const clases = Array.from(claseCheckboxes).map(cb => cb.value);
            
            if (ambitos.length === 2) { // Si se marcaron ambos ámbitos
                // Clases del ámbito Audiovisual: Director, Guionista
                const clasesAudiovisuales = ['Director', 'Guionista'];
                // Clases del ámbito Dramático: Dramaturgo, Compositor, Coreógrafo, Traductor
                const clasesDramaticas = ['Dramaturgo', 'Compositor', 'Coreógrafo', 'Traductor'];
                
                const tieneClaseAudiovisual = clases.some(clase => clasesAudiovisuales.includes(clase));
                const tieneClaseDramatica = clases.some(clase => clasesDramaticas.includes(clase));
                
                if (!tieneClaseAudiovisual) {
                    alert('Ha seleccionado ambos ámbitos. Por favor, seleccione al menos una clase del ámbito Audiovisual (Director o Guionista).');
                    return;
                }
                
                if (!tieneClaseDramatica) {
                    alert('Ha seleccionado ambos ámbitos. Por favor, seleccione al menos una clase del ámbito Dramático (Dramaturgo, Compositor, Coreógrafo o Traductor).');
                    return;
                }
            }
            
            // Validar observaciones obligatorias
            
            const datos = {
                rut: validacionInicialData.rut,
                tipoUsuario: validacionInicialData.tipoUsuario,
                emailValidacion: validacionInicialData.emailValidacion,
                campos: {
                    ambitos: ambitos,
                    clases: clases
                },
                observaciones: observacionesInput ? observacionesInput.value.trim() : ''
            };
            
            enviarDatosAPowerAutomate(datos, 'actualizacion-datos-autor-ambito');
        });
    }

    // Inicializar la sección si ya está visible
    if (document.getElementById('ambito-clase-form') && !document.getElementById('ambito-clase-form').classList.contains('hidden')) {
        initAmbitoClaseSection();
    }

    // ===== CÓDIGO DE SOCIEDADES =====
    let sociedadesData = [];
    let editingSociedadIndex = -1;
    let sociedadesDataGlobal = []; // Variable global para almacenar todas las sociedades

    function cargarSociedades() {
        const rutaAbsoluta = window.location.origin + '/assets/sociedades.json';
        
        fetch(rutaAbsoluta, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            cache: 'no-cache'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Almacenar todas las sociedades globalmente
            sociedadesDataGlobal = data;
            
            // Cargar países únicos en el select de países
            cargarPaisesSociedades(data);
            
            console.log('Sociedades cargadas correctamente:', data.length);
        })
        .catch(error => {
            console.error('Error al cargar las sociedades:', error);
        });
    }

    function cargarPaisesSociedades(sociedades) {
        const paisSelect = document.getElementById('sociedad-pais');
        if (!paisSelect) return;

        // Limpiar opciones existentes
        paisSelect.innerHTML = '<option value="">Selecciona un país</option>';

        // Obtener países únicos
        const paisesUnicos = [...new Set(sociedades.map(s => s.País))].sort();

        // Agregar opciones al select
        paisesUnicos.forEach(pais => {
            const option = document.createElement('option');
            option.value = pais;
            option.textContent = pais;
            paisSelect.appendChild(option);
        });
    }

    function actualizarSociedadesPorPais(paisSeleccionado) {
        const sociedadSelect = document.getElementById('sociedad-nombre');
        if (!sociedadSelect) return;

        // Limpiar opciones existentes
        sociedadSelect.innerHTML = '<option value="">Selecciona una sociedad</option>';

        if (!paisSeleccionado) {
            return;
        }

        // Filtrar sociedades por país
        const sociedadesFiltradas = sociedadesDataGlobal.filter(s => s.País === paisSeleccionado);

        // Agregar opciones al select
        sociedadesFiltradas.forEach(sociedad => {
            const option = document.createElement('option');
            option.value = sociedad.Sociedad;
            option.textContent = sociedad.Sociedad;
            sociedadSelect.appendChild(option);
        });

        // Agregar opción "Otra"
        const otraOption = document.createElement('option');
        otraOption.value = 'Otra';
        otraOption.textContent = 'Otra';
        sociedadSelect.appendChild(otraOption);
    }

    function renderizarTablaSociedades() {
        const sociedadesBody = document.getElementById('sociedades-body');
        if (!sociedadesBody) return;
        
        sociedadesBody.innerHTML = '';
        
        if (sociedadesData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" style="text-align: center;">No hay otras sociedades ingresadas en esta solicitud.</td>`;
            sociedadesBody.appendChild(row);
            return;
        }
        
        sociedadesData.forEach((sociedad, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sociedad.sociedad}</td>
                <td>${sociedad.pais}</td>
                <td>${sociedad.ambito}</td>
                <td>${sociedad.clase}</td>
                <td class="action-buttons">
                    <button type="button" class="action-button edit-button" data-index="${index}">Editar</button>
                    <button type="button" class="action-button delete-button" data-index="${index}">Eliminar</button>
                </td>
            `;
            sociedadesBody.appendChild(row);
        });
        
        // Agregar event listeners a los botones de acción
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editarSociedad(index);
            });
        });
        
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                eliminarSociedad(index);
            });
        });
    }

    function mostrarFormularioSociedad() {
        const sociedadForm = document.getElementById('sociedad-form');
        if (sociedadForm) {
            sociedadForm.classList.remove('hidden');
            // Limpiar el formulario
            document.getElementById('sociedad-nombre').value = '';
            document.getElementById('otra-sociedad-nombre').value = '';
            document.getElementById('sociedad-pais').value = '';
            document.getElementById('sociedad-ambito').value = '';
            document.getElementById('sociedad-clase').value = '';
            
            // Ocultar campo "otra sociedad"
            document.getElementById('otra-sociedad-field').classList.add('hidden');
            
            // Cargar sociedades si no están cargadas
            if (!sociedadesDataGlobal || sociedadesDataGlobal.length === 0) {
                cargarSociedades();
            } else {
                // Cargar países y limpiar sociedades
                cargarPaisesSociedades(sociedadesDataGlobal);
                actualizarSociedadesPorPais(''); // Limpiar sociedades
            }
            
            editingSociedadIndex = -1;
        }
    }

    function ocultarFormularioSociedad() {
        const sociedadForm = document.getElementById('sociedad-form');
        if (sociedadForm) {
            sociedadForm.classList.add('hidden');
        }
    }

    // Función para obtener las clases según el ámbito seleccionado
    function getClasesPorAmbito(ambito) {
        if (ambito === 'Audiovisual') {
            return ['Director', 'Guionista'];
        } else if (ambito === 'Dramático') {
            return ['Dramaturgo', 'Coreógrafo', 'Compositor', 'Traductor'];
        }
        return [];
    }

    function actualizarClasesSociedad() {
        const ambitoSelect = document.getElementById('sociedad-ambito');
        const claseSelect = document.getElementById('sociedad-clase');
        
        if (!ambitoSelect || !claseSelect) return;
        
        const selectedAmbito = ambitoSelect.value;
        
        // Limpiar opciones de clase
        claseSelect.innerHTML = '<option value="">Selecciona una clase</option>';
        
        if (selectedAmbito) {
            const clases = getClasesPorAmbito(selectedAmbito);
            clases.forEach(clase => {
                const option = document.createElement('option');
                option.value = clase;
                option.textContent = clase;
                claseSelect.appendChild(option);
            });
        }
    }

    function guardarSociedad() {
        const sociedadNombre = document.getElementById('sociedad-nombre').value;
        const otraSociedadNombre = document.getElementById('otra-sociedad-nombre').value;
        const sociedadPais = document.getElementById('sociedad-pais').value;
        const sociedadAmbito = document.getElementById('sociedad-ambito').value;
        const sociedadClase = document.getElementById('sociedad-clase').value;
        
        if (!sociedadPais || !sociedadAmbito || !sociedadClase) {
            alert('Por favor Por favor, completa todos los campos los campos obligatorios');
            return;
        }
        
        const nombreFinal = sociedadNombre === 'Otra' ? otraSociedadNombre : sociedadNombre;
        
        if (!nombreFinal) {
            alert('Por favor ingresa el nombre de la sociedad');
            return;
        }
        
        const nuevaSociedad = {
            sociedad: nombreFinal,
            pais: sociedadPais,
            ambito: sociedadAmbito,
            clase: sociedadClase
        };
        
        if (editingSociedadIndex >= 0) {
            sociedadesData[editingSociedadIndex] = nuevaSociedad;
        } else {
            sociedadesData.push(nuevaSociedad);
        }
        
        renderizarTablaSociedades();
        ocultarFormularioSociedad();
    }

    function editarSociedad(index) {
        const sociedad = sociedadesData[index];
        
        document.getElementById('sociedad-pais').value = sociedad.pais;
        
        // Cargar sociedades para el país seleccionado
        actualizarSociedadesPorPais(sociedad.pais);
        
        // Esperar un momento para que se carguen las opciones
        setTimeout(() => {
            document.getElementById('sociedad-nombre').value = sociedad.sociedad;
            document.getElementById('sociedad-ambito').value = sociedad.ambito;
            
            // Actualizar clases basadas en el ámbito
            actualizarClasesSociedad();
            
            setTimeout(() => {
                document.getElementById('sociedad-clase').value = sociedad.clase;
            }, 100);
        }, 100);
        
        editingSociedadIndex = index;
        mostrarFormularioSociedad();
    }

    function eliminarSociedad(index) {
        if (confirm('¿Está seguro de que desea eliminar esta sociedad?')) {
            sociedadesData.splice(index, 1);
            renderizarTablaSociedades();
        }
    }

    // Event listeners para sociedades
    const addSociedadBtn = document.getElementById('add-sociedad');
    if (addSociedadBtn) {
        addSociedadBtn.addEventListener('click', mostrarFormularioSociedad);
    }

    const saveSociedadBtn = document.getElementById('save-sociedad');
    if (saveSociedadBtn) {
        saveSociedadBtn.addEventListener('click', guardarSociedad);
    }

    const cancelSociedadBtn = document.getElementById('cancel-sociedad');
    if (cancelSociedadBtn) {
        cancelSociedadBtn.addEventListener('click', ocultarFormularioSociedad);
    }

    // Event listener para cambio de ámbito
    const sociedadAmbitoSelect = document.getElementById('sociedad-ambito');
    if (sociedadAmbitoSelect) {
        sociedadAmbitoSelect.addEventListener('change', actualizarClasesSociedad);
    }

    // Event listener para cambio de país (filtrar sociedades)
    const sociedadPaisSelect = document.getElementById('sociedad-pais');
    if (sociedadPaisSelect) {
        sociedadPaisSelect.addEventListener('change', function() {
            actualizarSociedadesPorPais(this.value);
            // Limpiar selección de sociedad cuando cambia el país
            const sociedadSelect = document.getElementById('sociedad-nombre');
            if (sociedadSelect) {
                sociedadSelect.value = '';
            }
            // Ocultar campo "otra sociedad"
            const otraSociedadField = document.getElementById('otra-sociedad-field');
            if (otraSociedadField) {
                otraSociedadField.classList.add('hidden');
            }
        });
    }

    // Event listener para cambio de sociedad (mostrar/ocultar campo "otra")
    const sociedadNombreSelect = document.getElementById('sociedad-nombre');
    if (sociedadNombreSelect) {
        sociedadNombreSelect.addEventListener('change', function() {
            const otraSociedadField = document.getElementById('otra-sociedad-field');
            if (this.value === 'Otra') {
                otraSociedadField.classList.remove('hidden');
            } else {
                otraSociedadField.classList.add('hidden');
            }
        });
    }

    // Validación de RUT para sociedades
    const validateRutSociedadesButton = document.getElementById('validate-rut-sociedades');
    if (validateRutSociedadesButton) {
        validateRutSociedadesButton.addEventListener('click', function() {
            const rutInput = document.getElementById('rut-inicial');
            const rutError = document.getElementById('rut-error-sociedades');
            const form = document.getElementById('sociedades-form-content');
            
            if (!rutInput || !rutError) return;
            
            const rutValue = rutInput.value.trim();
            
            if (!rutValue) {
                rutError.textContent = 'Por favor ingresa un RUT';
                return;
            }
            
            if (!validarRut(rutValue)) {
                rutError.textContent = 'RUT del autor inválido';
            } else {
                rutError.textContent = '';
                if (form) {
                    form.classList.remove('hidden');
                    // Cargar datos después de mostrar el formulario
                    cargarSociedades();
                    renderizarTablaSociedades();
                }
            }
        });
    }

    // Handler de envío para sociedades
    const submitButtonSociedades = document.getElementById('submit-button-sociedades');
    if (submitButtonSociedades) {
        submitButtonSociedades.addEventListener('click', function() {
            const observacionesInput = document.getElementById('observaciones-sociedades');
            
            // Debug: verificar el estado de validacionInicialData
            console.log('Debug - validacionInicialData al enviar:', validacionInicialData);
            
            // Usar el RUT almacenado en validacionInicialData en lugar del campo HTML
            if (!validacionInicialData.rut || !validacionInicialData.rut.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            // Validar que se haya registrado al menos una sociedad
            if (!sociedadesData || sociedadesData.length === 0) {
                alert('Debe registrar al menos una sociedad antes de enviar la solicitud.');
                return;
            }
            
            const datos = {
                rut: validacionInicialData.rut,
                tipoUsuario: validacionInicialData.tipoUsuario || '',
                emailValidacion: validacionInicialData.emailValidacion || '',
                sociedades: sociedadesData,
                observaciones: observacionesInput ? observacionesInput.value.trim() : ''
            };
            
            enviarDatosAPowerAutomate(datos, 'actualizacion-datos-autor-sociedades');
        });
    }

    // ===== CÓDIGO DE EXHIBICIONES =====
    // Funciones para la gestión de exhibiciones
    function validarFormatoFecha(fecha) {
        const regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/;
        return regex.test(fecha);
    }

    // FUNCIÓN DUPLICADA ELIMINADA - Esta función solo mostraba los campos originales
    // La función correcta está en la línea 1102 con todos los campos nuevos

    // FUNCIÓN DUPLICADA ELIMINADA - La función completa está en la línea 1192

    function ocultarFormularioExhibicion() {
        const exhibicionForm = document.getElementById('exhibicion-form');
        if (exhibicionForm) {
            exhibicionForm.classList.add('hidden');
        }
    }

    // FUNCIÓN DUPLICADA ELIMINADA - Esta función estaba sobrescribiendo la función principal
    // que incluye los nuevos campos (tituloTraducido, canal, fechaTermino)

    function editarExhibicion(index) {
        const exhibicion = exhibicionesData[index];
        
        document.getElementById('exhibicion-ambito').value = exhibicion.ambito;
        document.getElementById('exhibicion-obra').value = exhibicion.obra;
        document.getElementById('exhibicion-pais').value = exhibicion.pais;
        document.getElementById('exhibicion-fecha').value = exhibicion.fecha;
        
        editingIndex = index;
        const exhibicionForm = document.getElementById('exhibicion-form');
        if (exhibicionForm) {
            exhibicionForm.classList.remove('hidden');
        }
    }

    function eliminarExhibicion(index) {
        if (confirm('¿Está seguro de que desea eliminar esta exhibición?')) {
            exhibicionesData.splice(index, 1);
            renderizarTablaExhibiciones();
        }
    }

    // Event listeners para exhibiciones
    const addExhibicionBtn = document.getElementById('add-exhibicion');
    if (addExhibicionBtn) {
        addExhibicionBtn.addEventListener('click', mostrarFormularioExhibicion);
    }

    const saveExhibicionBtn = document.getElementById('save-exhibicion');
    console.log('Botón save-exhibicion encontrado:', saveExhibicionBtn);
    if (saveExhibicionBtn) {
        console.log('Asignando event listener al botón save-exhibicion');
        saveExhibicionBtn.addEventListener('click', function(e) {
            console.log('¡CLICK EN BOTÓN GUARDAR DETECTADO!');
            e.preventDefault();
            try {
                console.log('Intentando ejecutar guardarExhibicion()...');
                guardarExhibicion();
                console.log('guardarExhibicion() ejecutada exitosamente');
            } catch (error) {
                console.error('ERROR en guardarExhibicion():', error);
                console.error('Stack trace:', error.stack);
            }
        });
    } else {
        console.error('ERROR: No se encontró el botón save-exhibicion');
    }

    const cancelExhibicionBtn = document.getElementById('cancel-exhibicion');
    if (cancelExhibicionBtn) {
        cancelExhibicionBtn.addEventListener('click', ocultarFormularioExhibicion);
    }

    // Submit button para exhibiciones
    const submitButtonExhibicion = document.getElementById('submit-button-exhibicion');
    if (submitButtonExhibicion) {
        submitButtonExhibicion.addEventListener('click', function() {
            const observacionesInput = document.getElementById('observaciones-exhibicion');
            
            // Usar el RUT almacenado en validacionInicialData
            if (!validacionInicialData.rut || !validacionInicialData.rut.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            // Validar que existan exhibiciones registradas
            if (!exhibicionesData || exhibicionesData.length === 0) {
                alert('Por favor, agregue al menos una exhibición antes de enviar la solicitud.');
                return;
            }
            
            const datos = {
                rut: validacionInicialData.rut,
                tipoUsuario: validacionInicialData.tipoUsuario || '',
                emailValidacion: validacionInicialData.emailValidacion || '',
                exhibiciones: exhibicionesData,
                observaciones: observacionesInput ? observacionesInput.value.trim() : ''
            };
            
            enviarDatosAPowerAutomate(datos, 'exhibicion-obra-extranjero');
        });
    }

    // Inicializar la tabla de exhibiciones
    renderizarTablaExhibiciones();

    // Inicializar la tabla de sociedades al cargar la página
    renderizarTablaSociedades();

    // Submit button para solicitud "Otro"
    const submitButtonOtro = document.getElementById('submit-button-otro');
    if (submitButtonOtro) {
        submitButtonOtro.addEventListener('click', function() {
            const detalleSolicitudInput = document.getElementById('detalleSolicitud');
            
            // Usar el RUT almacenado en validacionInicialData
            if (!validacionInicialData.rut || !validacionInicialData.rut.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            // Validar que el campo de detalle esté completo
            if (!detalleSolicitudInput || !detalleSolicitudInput.value.trim()) {
                alert('Por favor, ingresa los detalles de su solicitud.');
                return;
            }
            
            const datos = {
                rut: validacionInicialData.rut,
                tipoUsuario: validacionInicialData.tipoUsuario || '',
                emailValidacion: validacionInicialData.emailValidacion || '',
                detalleSolicitud: detalleSolicitudInput.value.trim()
            };
            
            enviarDatosAPowerAutomate(datos, 'otro');
        });
    }

    // Establecer valores por defecto para radio buttons de afiliación
    const ambitoNoAfiliacion = document.getElementById('ambito-no');
    const claseNoAfiliacion = document.getElementById('clase-no');
    if (ambitoNoAfiliacion) {
        ambitoNoAfiliacion.checked = true;
    }
    if (claseNoAfiliacion) {
        claseNoAfiliacion.checked = true;
    }

});  // Fin del DOMContentLoaded

// ===== CÓDIGO DE UBICACIÓN (PAÍSES, REGIONES, COMUNAS) =====

// Variables globales para datos de países y regiones
let paisesData = [];
    let regionesComunasData = [];

    // Cargar datos de países y regiones al inicializar
    async function loadLocationData() {
        try {
            // Cargar países
            const paisesResponse = await fetch('./assets/paises.json');
            paisesData = await paisesResponse.json();
            
            // Cargar regiones y comunas
            const regionesResponse = await fetch('./assets/regionesycomunas.json');
            regionesComunasData = await regionesResponse.json();
            
            // Poblar el select de países
            populateCountries();
        } catch (error) {
            console.error('Error cargando datos de ubicación:', error);
        }
    }

    // Poblar el select de países
    function populateCountries() {
        const paisSelect = document.getElementById('pais');
        if (paisSelect) {
            // Limpiar opciones existentes (excepto la primera)
            paisSelect.innerHTML = '<option value="">Selecciona una opción</option>';
            
            // Agregar países
            paisesData.forEach(pais => {
                const option = document.createElement('option');
                option.value = pais['Nombre del país'];
                option.textContent = pais['Nombre del país'];
                paisSelect.appendChild(option);
            });
        }
    }

    // Poblar el select de regiones (solo regiones únicas)
    function populateRegions() {
        const regionSelect = document.getElementById('region');
        if (regionSelect) {
            // Limpiar opciones existentes
            regionSelect.innerHTML = '<option value="">Selecciona una opción</option>';
            
            // Obtener regiones únicas
            const regionesUnicas = [...new Set(regionesComunasData.map(item => item.Región))];
            
            // Agregar regiones
            regionesUnicas.forEach(region => {
                const option = document.createElement('option');
                option.value = region;
                option.textContent = region;
                regionSelect.appendChild(option);
            });
        }
    }

    // Poblar el select de comunas basado en la región seleccionada
    function populateCommunes(selectedRegion) {
        const comunaSelect = document.getElementById('comuna');
        if (comunaSelect) {
            // Limpiar opciones existentes
            comunaSelect.innerHTML = '<option value="">Selecciona una opción</option>';
            
            // Filtrar comunas por región
            const comunasFiltradas = regionesComunasData
                .filter(item => item.Región === selectedRegion)
                .map(item => item.Comuna);
            
            // Agregar comunas
            comunasFiltradas.forEach(comuna => {
                const option = document.createElement('option');
                option.value = comuna;
                option.textContent = comuna;
                comunaSelect.appendChild(option);
            });
        }
    }

    // Manejar cambio de país
    function handleCountryChange() {
        const paisSelect = document.getElementById('pais');
        const estadoField = document.getElementById('estado-field');
        const distritoField = document.getElementById('distrito-field');
        const regionField = document.getElementById('region-field');
        const comunaField = document.getElementById('comuna-field');
        
        if (paisSelect && paisSelect.value === 'Chile') {
            // Mostrar campos de Chile
            estadoField.classList.add('hidden');
            distritoField.classList.add('hidden');
            regionField.classList.remove('hidden');
            comunaField.classList.remove('hidden');
            
            // Poblar regiones
            populateRegions();
        } else if (paisSelect && paisSelect.value !== '') {
            // Mostrar campos para otros países
            estadoField.classList.remove('hidden');
            distritoField.classList.remove('hidden');
            regionField.classList.add('hidden');
            comunaField.classList.add('hidden');
        } else {
            // Ocultar todos los campos específicos
            estadoField.classList.add('hidden');
            distritoField.classList.add('hidden');
            regionField.classList.add('hidden');
            comunaField.classList.add('hidden');
        }
    }

    // Manejar cambio de región
    function handleRegionChange() {
        const regionSelect = document.getElementById('region');
        if (regionSelect && regionSelect.value) {
            populateCommunes(regionSelect.value);
        }
    }

    // Configurar event listeners para los campos de dirección
    function setupAddressFieldListeners() {
        const paisSelect = document.getElementById('pais');
        const regionSelect = document.getElementById('region');
        
        if (paisSelect) {
            paisSelect.removeEventListener('change', handleCountryChange); // Evitar duplicados
            paisSelect.addEventListener('change', handleCountryChange);
        }
        
        if (regionSelect) {
            regionSelect.removeEventListener('change', handleRegionChange); // Evitar duplicados
            regionSelect.addEventListener('change', handleRegionChange);
        }
    }

    // Cargar datos de ubicación al inicializar la página
    loadLocationData();

// Funciones para el modal informativo post-validación
function showInfoModal() {
    /**
     * Muestra el modal informativo después de una validación exitosa
     * Bloquea la interacción con el formulario hasta que el usuario haga clic en "Entendido"
     */
    const infoModal = document.getElementById('info-modal');
    if (infoModal) {
        infoModal.classList.remove('hidden');
        // Enfocar el botón para accesibilidad
        const understoodButton = document.getElementById('info-modal-understood');
        if (understoodButton) {
            understoodButton.focus();
        }
    }
}

function hideInfoModal() {
    /**
     * Cierra el modal informativo y desbloquea el formulario
     * Permite al usuario continuar con el proceso de completar el formulario
     */
    const infoModal = document.getElementById('info-modal');
    if (infoModal) {
        infoModal.classList.add('hidden');
    }
}

// Event listener para el botón "Entendido" del modal informativo
document.addEventListener('DOMContentLoaded', function() {
    const understoodButton = document.getElementById('info-modal-understood');
    if (understoodButton) {
        understoodButton.addEventListener('click', function() {
            hideInfoModal();
        });
    }
    
    // Cerrar modal con tecla Escape para accesibilidad
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const infoModal = document.getElementById('info-modal');
            if (infoModal && !infoModal.classList.contains('hidden')) {
                hideInfoModal();
            }
        }
    });
});
