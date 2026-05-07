import { Metadata } from 'next';
import FeaturePermissionsClient from './FeaturePermissionsClient';

export const metadata: Metadata = {
    title: 'Feature Config | Admin',
};

export default function FeatureConfigPage() {
    return <FeaturePermissionsClient />;
}
