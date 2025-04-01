import * as React from 'react';
import i18next from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { removeIDPModal } from '@console/internal/components/modals';
import { EmptyBox, Kebab, KebabOption, asAccessReview } from '@console/internal/components/utils';
import { OAuthModel } from '@console/internal/models';
import { IdentityProvider, OAuthKind } from '@console/internal/module/k8s';

const removeIDP = (obj: OAuthKind, idpName: string, type: string): KebabOption => {
  return {
    label: i18next.t('console-app~Remove Identity provider'),
    callback: () =>
      removeIDPModal({
        obj,
        idpName,
        type,
      }),
    accessReview: asAccessReview(OAuthModel, obj, 'patch'),
  };
};

const IDPKebab: React.FC<IDPKebabProps> = ({ obj, idpName, type }) => {
  const options: KebabOption[] = [removeIDP(obj, idpName, type)];
  return <Kebab options={options} />;
};

export const IdentityProviders: React.FC<IdentityProvidersProps> = ({ identityProviders, obj }) => {
  const { t } = useTranslation();
  return _.isEmpty(identityProviders) ? (
    <EmptyBox label={t('console-app~Identity providers')} />
  ) : (
    <div className="co-table-container">
      <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
        <thead className="pf-v6-c-table__thead">
          <tr className="pf-v6-c-table__tr">
            <th className="pf-v6-c-table__th">{t('console-app~Name')}</th>
            <th className="pf-v6-c-table__th">{t('console-app~Type')}</th>
            <th className="pf-v6-c-table__th">{t('console-app~Mapping method')}</th>
          </tr>
        </thead>
        <tbody className="pf-v6-c-table__tbody">
          {_.map(identityProviders, (idp) => (
            <tr className="pf-v6-c-table__tr" key={idp.name}>
              <td className="pf-v6-c-table__td" data-test-idp-name={idp.name}>
                {idp.name}
              </td>
              <td className="pf-v6-c-table__td" data-test-idp-type-for={idp.name}>
                {idp.type}
              </td>
              <td className="pf-v6-c-table__td" data-test-idp-mapping-for={idp.name}>
                {idp.mappingMethod || 'claim'}
              </td>
              <td className="pf-v6-c-table__td" data-test-idp-kebab-for={idp.name}>
                <IDPKebab obj={obj} idpName={idp.name} type={idp.type} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

type IdentityProvidersProps = {
  identityProviders: IdentityProvider[];
  obj: OAuthKind;
};

type IDPKebabProps = {
  obj: OAuthKind;
  idpName: string;
  type: string;
};
