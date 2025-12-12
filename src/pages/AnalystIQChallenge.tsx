import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { DatasetExplorer } from '@/components/hackathon/DatasetExplorer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AnalystIQChallenge = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = (searchParams.get('mode') as 'forensic' | 'reverse' | 'racer') || 'forensic';
  const datasetId = searchParams.get('dataset') || undefined;

  return (
    <MainLayout>
      <div className="p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/hackathons')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Hub
        </Button>

        <DatasetExplorer mode={mode} datasetId={datasetId} />
      </div>
    </MainLayout>
  );
};

export default AnalystIQChallenge;
 