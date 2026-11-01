const active=new WeakMap();
export function invalidatePanelMount(panel){active.delete(panel);}
export function beginPanelMount(panel){const token={};active.set(panel,token);return()=>panel.isConnected&&active.get(panel)===token;}
