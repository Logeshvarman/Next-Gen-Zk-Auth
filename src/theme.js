import { ipfsCids } from './ipfsCids';


const colorTheme = {
  default: {
    color1: '#FF0080',
    color2: '#FF0080',
    text: '#FAFAFA',
    textHighlight: '#FF0080',
    button: '#7928CA',
    fallbackPfpIpfsCid: ipfsCids.NextGenZkAuth,
  },
};

export const getThemeData = (theme = 'dark') => colorTheme[theme];