"use client";

import { Modal, Typography } from "antd";
import { useMemo } from "react";

const { Title, Paragraph } = Typography;

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal = ({
  open,
  onClose,
}: PrivacyPolicyModalProps) => {
  return (
    <Modal
      title="Política de Privacidade"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <Title level={4}>1. Introdução</Title>
          <Paragraph>
            Esta Política de Privacidade descreve como os seus dados pessoais são
            coletados, utilizados e protegidos quando utiliza o sistema de gestão
            de caravanas ao templo. Ao utilizar este sistema, você concorda com
            esta política.
          </Paragraph>
        </div>

        <div>
          <Title level={4}>2. Dados Coletados</Title>
          <Paragraph>
            Coletamos os seguintes dados pessoais para fins de gestão da
            caravana:
          </Paragraph>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Nome completo</li>
            <li>Número de telefone</li>
            <li>Email (quando aplicável)</li>
            <li>Capela de partida</li>
            <li>Informações sobre ordenanças do templo</li>
            <li>Informações sobre responsável legal (para menores de idade)</li>
            <li>Status de pagamento</li>
          </ul>
        </div>

        <div>
          <Title level={4}>3. Finalidade do Tratamento</Title>
          <Paragraph>
            Os dados coletados são utilizados exclusivamente para:
          </Paragraph>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Gestão e organização da caravana ao templo</li>
            <li>Comunicação com os participantes sobre a caravana</li>
            <li>Organização dos autocarros e distribuição de passageiros</li>
            <li>Registo de ordenanças do templo</li>
            <li>Controlo de pagamentos e gestão financeira da caravana</li>
          </ul>
        </div>

        <div>
          <Title level={4}>4. Base Legal (RGPD)</Title>
          <Paragraph>
            O tratamento dos seus dados pessoais baseia-se no seu consentimento
            explícito, conforme o Regulamento Geral sobre a Proteção de Dados
            (RGPD) da União Europeia. Ao aceitar esta política, você consente
            expressamente com o tratamento dos seus dados para as finalidades
            descritas.
          </Paragraph>
        </div>

        <div>
          <Title level={4}>5. Conservação dos Dados</Title>
          <Paragraph>
            Os dados pessoais serão conservados apenas pelo tempo necessário
            para cumprir as finalidades para as quais foram coletados, ou
            conforme exigido por lei.
          </Paragraph>
        </div>

        <div>
          <Title level={4}>6. Direitos do Titular dos Dados</Title>
          <Paragraph>
            De acordo com o RGPD, você tem os seguintes direitos:
          </Paragraph>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong>Direito de acesso:</strong> Pode solicitar informações
              sobre os seus dados pessoais que temos
            </li>
            <li>
              <strong>Direito de retificação:</strong> Pode solicitar a
              correção de dados incorretos ou incompletos
            </li>
            <li>
              <strong>Direito ao apagamento:</strong> Pode solicitar a
              eliminação dos seus dados pessoais
            </li>
            <li>
              <strong>Direito à portabilidade:</strong> Pode solicitar a
              transferência dos seus dados
            </li>
            <li>
              <strong>Direito de oposição:</strong> Pode opor-se ao tratamento
              dos seus dados
            </li>
            <li>
              <strong>Direito de retirar o consentimento:</strong> Pode retirar
              o seu consentimento a qualquer momento
            </li>
          </ul>
          <Paragraph className="mt-2">
            Para exercer estes direitos, entre em contacto através do email ou
            telefone da sua capela.
          </Paragraph>
        </div>

        <div>
          <Title level={4}>7. Segurança dos Dados</Title>
          <Paragraph>
            Implementamos medidas técnicas e organizacionais adequadas para
            proteger os seus dados pessoais contra acesso não autorizado,
            alteração, divulgação ou destruição.
          </Paragraph>
        </div>

        <div>
          <Title level={4}>8. Partilha de Dados</Title>
          <Paragraph>
            Os seus dados pessoais não serão partilhados com terceiros, exceto:
          </Paragraph>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              Com os gestores da caravana e líderes da estaca para fins de
              organização
            </li>
            <li>Quando exigido por lei ou ordem judicial</li>
            <li>Com o seu consentimento explícito</li>
          </ul>
        </div>

        <div>
          <Title level={4}>9. Sistema Não Oficial</Title>
          <Paragraph className="font-semibold text-gray-700">
            IMPORTANTE: Este sistema não é oficial da Igreja de Jesus Cristo
            dos Santos dos Últimos Dias. É uma ferramenta desenvolvida
            independentemente para auxiliar na gestão de caravanas locais.
          </Paragraph>
        </div>

        <div>
          <Title level={4}>10. Limitação de Responsabilidade</Title>
          <Paragraph>
            O desenvolvedor deste sistema e a Igreja de Jesus Cristo dos Santos
            dos Últimos Dias não se responsabilizam por:
          </Paragraph>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              Qualquer incumprimento desta política de privacidade que resulte
              de uso indevido do sistema por terceiros
            </li>
            <li>
              Perda, alteração ou acesso não autorizado a dados que resulte de
              falhas técnicas, ataques cibernéticos ou outras circunstâncias
              fora do controlo do desenvolvedor
            </li>
            <li>
              Qualquer dano direto, indireto, incidental ou consequente
              resultante do uso ou impossibilidade de uso deste sistema
            </li>
            <li>
              Decisões tomadas com base em informações incorretas ou
              desatualizadas no sistema
            </li>
          </ul>
          <Paragraph className="mt-2 font-semibold">
            Ao utilizar este sistema, você reconhece e aceita que o faz por sua
            conta e risco. O desenvolvedor e a Igreja não assumem qualquer
            responsabilidade legal ou financeira por qualquer consequência
            resultante do uso deste sistema.
          </Paragraph>
        </div>

        <div>
          <Title level={4}>11. Alterações à Política</Title>
          <Paragraph>
            Esta política de privacidade pode ser atualizada periodicamente. A
            versão mais recente estará sempre disponível neste sistema. O uso
            continuado do sistema após alterações constitui aceitação da nova
            política.
          </Paragraph>
        </div>

        <div>
          <Title level={4}>12. Contacto</Title>
          <Paragraph>
            Para questões sobre esta política de privacidade ou para exercer os
            seus direitos, entre em contacto com os gestores da caravana através
            da sua capela.
          </Paragraph>
        </div>

        <div>
          <Title level={4}>13. Transferências Internacionais de Dados</Title>
          <Paragraph>
            Os seus dados pessoais podem ser transferidos e armazenados em servidores
            localizados fora da União Europeia, nomeadamente nos Estados Unidos da América,
            através dos serviços da Google (Firebase), que fornece a infraestrutura de
            armazenamento de dados para este sistema.
          </Paragraph>
          <Paragraph>
            Estas transferências são realizadas com base em salvaguardas adequadas,
            incluindo:
          </Paragraph>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong>Cláusulas Contratuais Padrão (SCC):</strong> A Google utiliza
              Cláusulas Contratuais Padrão aprovadas pela Comissão Europeia para garantir
              que os seus dados pessoais recebem um nível adequado de proteção quando
              transferidos para fora da UE.
            </li>
            <li>
              <strong>Certificações de Adequação:</strong> A Google mantém certificações
              e compromissos de conformidade com padrões de proteção de dados reconhecidos
              internacionalmente.
            </li>
          </ul>
          <Paragraph className="mt-2">
            Ao utilizar este sistema, você consente com estas transferências internacionais
            de dados, reconhecendo que os seus dados podem ser processados em servidores
            localizados fora da UE, mas sempre com as salvaguardas adequadas em vigor.
          </Paragraph>
        </div>

        <div className="border-t pt-4 mt-6">
          <Paragraph className="text-sm text-gray-500">
            Última atualização: {new Date().toLocaleDateString("pt-PT")}
          </Paragraph>
        </div>
      </div>
    </Modal>
  );
};
