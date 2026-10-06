import { runC2BRegistration } from '../src/lib/mpesa-register';

runC2BRegistration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });