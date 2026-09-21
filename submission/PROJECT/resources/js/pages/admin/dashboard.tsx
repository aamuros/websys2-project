import { OperationsDashboard } from '@/components/operations-dashboard';
export default function AdminDashboard(props:{metrics:Record<string,number>;requests:any[]}){return <OperationsDashboard admin {...props}/>}
