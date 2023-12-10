import { Welcome } from '../components/Welcome/Welcome';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import MangaCrop from './mangaCrop/MangaCrop';
import dynamic from 'next/dynamic';
const DynamicComponent = dynamic(() => import('./mangaCrop/MangaCrop'));

export default function HomePage() {
  return (
    <>
      {/* <MangaCrop /> */}
      <DynamicComponent />
    </>
  );
}
