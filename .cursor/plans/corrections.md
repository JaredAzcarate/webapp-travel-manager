Gestão de Capelas
- Agregar el campo "Lugar de saida do autocarro" (este campo sera el luagar de donde saldra el bus) y cada unidad (capela) tendra una direccion de donde saldra el bus
- Data de Criação no es necesario en la tabla

Distribuição de Passageiros
- Necesitamos poder exportar a excel los inscriptos (con formato del templo). Para esto utilizaremos la libreria "ExcelJS" para completar un template que usa el templo para las caravanas (el template estara en public).

Formulario de participante
- El campo "É uma ordenança personal?" debe estar antes de las ordenanzas (como un checkbox unico y no por cada ordenanza), si es verdadero entonces mostrar solo un campo de ordenança. SI no es verdadero mostrar la opcion de las 3 ordennazas.
- La inscripcion debe estar en 3 pasos: 
  - PASO 1
    - Capela de Partida
    - Esta inscrição é de um jovem menor de idade
    - É a sua primeira vez no templo como recém-converso?
    - Tem menos de 1 ano como membro?
  - PASO 2
      - (Esta inscrição é de um jovem menor de idade) SIM: Nome Completo, Sexo, Nome do Responsável Legal, Email do Responsável Legal, Telefone do Responsável Legal
      - (Esta inscrição é de um jovem menor de idade) NAO: Nome Completo, Número de Telefone , Sexo, 
        - (É a sua primeira vez no templo como recém-converso?) ou (Tem menos de 1 ano como membro?) NAO: És oficiante?
  - PASO 3 (ORDENANÇAS) (No puede haber interpolacion entre las horas seleccionadas. por ejemplo: si se selecciona una sesion de las 11 a las 12 en la ordenanza 1, luego la ordenanza 2 tiene que mostrar los horarios que no interfieren con la ordenanza 1)
    - (Esta inscrição é de um jovem menor de idade) ou (É a sua primeira vez no templo como recém-converso?) ou (Tem menos de 1 ano como membro?) SIM: Ordenança 1, Ordenança 2, Ordenança 3 (solo puede hacer batisterio)
    - (Esta inscrição é de um jovem menor de idade) ou (É a sua primeira vez no templo como recém-converso?) ou (Tem menos de 1 ano como membro?) NAO: Ordenança 1, Ordenança 2, Ordenança 3
      - (Sexo masculino) TRUE: No mostrar la ordenanza "Iniciatória - Irmãs"
      - (Sexo femenino) TRUE: No mostrar la ordenanza "Iniciatória - Irmãos"
  - PASO 4 (Politicas de privacidad)
    - Checkbox que acepta la utilizacion de los datos registrados y explicar para que es utilizado e inidcar que este sistema no es oficial de la iglesia.


Gestão de Autocarros
- Modificar el label de los botones: "Ver paradas" > "Paragens", "Número de Paradas" > "Quantidade de paragens"
- "Data de Criação" no es necesario

Gestores
- Lista de gestores (Nome de usaurio, data de criacao, acoes: editar) > Al editar abre modal lateral con los datos del usuario actual y que permita cambiar la contraseña de manera simple.
- Agregar boton de "Criar Usuário" > abrir modal lateral para crear usuario

Firestore
- Añadir reglas en firestore para restringir y proteger endpoints

Paginas de politicas de privacidad
- Verificar que cumplimos con la ley de politicas de privacidad de europa
- Verificar que las politicas de privacidad esten a favor del desarrollador que cualquier incumplimiento no se responsabiliza ni a la iglesia ni al desarrollador.

Pagina de confirmacao de inscricao
- Ajustar el diseño para quedar similar al resto de la app

Pagina para crear un usuario admin
- Eliminar (change-admin-password) de lo publico