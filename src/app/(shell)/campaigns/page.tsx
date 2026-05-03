import CampaignsListClient from './CampaignsListClient';

export const metadata = {
    title: 'Campaigns | MediaHive',
    description: 'Track all media campaigns and associated tasks.',
};

export default function CampaignsPage() {
    return <CampaignsListClient />;
}
