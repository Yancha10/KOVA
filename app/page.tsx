import TrainingApp from './components/TrainingApp';
import {getChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getChatGPTUser();return <TrainingApp accountId={user?.userId||'preview-local'} signedIn={!!user}/>;}
