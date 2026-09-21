import { OperationsDashboard } from '@/components/operations-dashboard';
export default function StaffDashboard(props:{metrics:Record<string,number>;requests:any[]}){return <OperationsDashboard {...props}/>}
