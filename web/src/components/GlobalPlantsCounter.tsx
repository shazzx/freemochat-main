import { FC } from 'react';
import { TreePine, ChevronRight } from 'lucide-react';
import { useGlobalEnvironmentalContributionsCount } from '@/hooks/Post/usePost';

interface GlobalPlantsCounterProps {
    onNavigate?: () => void;
}

const GlobalPlantsCounter: FC<GlobalPlantsCounterProps> = ({
    onNavigate = () => console.log('Navigate to global environmental map')
}) => {
    const { data, isLoading } = useGlobalEnvironmentalContributionsCount();

    if (isLoading) {
        return null;
    }

    return (
        <div className="flex items-center p-4 bg-green-500 shadow-lg rounded-lg cursor-pointer hover:bg-green-600 transition-colors duration-200">
            <div className="bg-white/20 rounded-full p-2 mr-3">
                <TreePine size={20} className="text-white" />
            </div>

            <div className="flex-1">
                <div className="text-white text-xs font-medium uppercase tracking-wide">
                    Global Plants
                </div>
                <div className="text-white text-lg font-bold mt-1">
                    {data?.categories?.plantation?.totalTrees?.toLocaleString() || '0'}
                </div>
            </div>

            <button
                onClick={onNavigate}
                className="text-white hover:text-green-100 transition-colors duration-200 p-1 rounded"
                aria-label="View global environmental map"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
};

export default GlobalPlantsCounter;